import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/server/db/prisma";
import os from "os";
import { put, list } from "@vercel/blob";

const backupsRoot = path.join(process.env.VERCEL === "1" ? os.tmpdir() : process.cwd(), "backups", "db");

type BackupMetadata = {
  counts: Record<string, number>;
  createdAt: string;
  initiatedBy?: string;
  reason: string;
  version: 1;
};

type BackupEnvelope = {
  data: Record<string, unknown>;
  metadata: BackupMetadata;
};

function timestampForFile(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function backupDirectoryForDate(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return path.join(backupsRoot, year, month);
}

function serializeForJson<TValue>(value: TValue) {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) => (typeof currentValue === "bigint" ? currentValue.toString() : currentValue))
  ) as TValue;
}

export async function createSystemBackup({
  initiatedBy,
  reason
}: {
  initiatedBy?: string;
  reason: string;
}) {
  const createdAtDate = new Date();
  const createdAt = createdAtDate.toISOString();
  const directory = backupDirectoryForDate(createdAtDate);
  const fileName = `ava-backup-${timestampForFile(createdAtDate)}.json`;
  const filePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });

  const [
    adminUsers,
    disciplines,
    classGroups,
    themes,
    tags,
    questions,
    questionOptions,
    questionTags,
    questionThemes,
    exams,
    examThemes,
    examSections,
    examQuestions,
    publicExamLinks,
    studentAttempts,
    studentProfiles,
    answers,
    answerAttachments,
    manualCorrections,
    feedbackFormResponses,
    feedbackAnswers,
    reportShareLinks,
    issueReports
  ] = await prisma.$transaction([
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.discipline.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.classGroup.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.theme.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tag.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.question.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.questionOption.findMany({ orderBy: { position: "asc" } }),
    prisma.questionTag.findMany(),
    prisma.questionTheme.findMany(),
    prisma.exam.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.examTheme.findMany(),
    prisma.examSection.findMany({ orderBy: { position: "asc" } }),
    prisma.examQuestion.findMany({ orderBy: { position: "asc" } }),
    prisma.publicExamLink.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.studentAttempt.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.studentProfileSnapshot.findMany(),
    prisma.answer.findMany({ orderBy: { answeredAt: "asc" } }),
    prisma.answerAttachment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.manualCorrection.findMany(),
    prisma.feedbackFormResponse.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.feedbackAnswer.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.reportShareLink.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.issueReport.findMany({ orderBy: { createdAt: "asc" } })
  ]);

  const data = serializeForJson({
    adminUsers,
    answerAttachments,
    answers,
    classGroups,
    disciplines,
    examQuestions,
    examSections,
    examThemes,
    exams,
    feedbackAnswers,
    feedbackFormResponses,
    issueReports,
    manualCorrections,
    publicExamLinks,
    questionOptions,
    questionTags,
    questionThemes,
    questions,
    reportShareLinks,
    studentAttempts,
    studentProfiles,
    tags,
    themes
  });

  const metadata: BackupMetadata = {
    counts: Object.fromEntries(Object.entries(data).map(([key, list]) => [key, Array.isArray(list) ? list.length : 0])),
    createdAt,
    initiatedBy,
    reason,
    version: 1
  };

  const payload: BackupEnvelope = {
    data,
    metadata
  };

  const payloadString = JSON.stringify(payload, null, 2);
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.replace(/^["'](.+)["']$/, "$1");

  if (blobToken) {
    const year = String(createdAtDate.getUTCFullYear());
    const month = String(createdAtDate.getUTCMonth() + 1).padStart(2, "0");
    const blobPath = `backups/db/${year}/${month}/${fileName}`;

    const blob = await put(blobPath, Buffer.from(payloadString), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: blobToken
    });

    return {
      counts: metadata.counts,
      createdAt,
      fileName,
      filePath: blob.url,
      relativePath: blobPath
    };
  }

  await writeFile(filePath, payloadString, "utf-8");

  return {
    counts: metadata.counts,
    createdAt,
    fileName,
    filePath,
    relativePath: path.relative(process.env.VERCEL === "1" ? os.tmpdir() : process.cwd(), filePath).replace(/\\/g, "/")
  };
}

export async function listRecentBackups(limit = 10) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.replace(/^["'](.+)["']$/, "$1");

  if (blobToken) {
    try {
      const { blobs } = await list({ prefix: "backups/db/", token: blobToken });
      const sorted = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()).slice(0, limit);

      return Promise.all(
        sorted.map(async (blob) => {
          const res = await fetch(blob.url);
          const raw = await res.text();
          const payload = JSON.parse(raw) as BackupEnvelope;

          return {
            counts: payload.metadata.counts,
            createdAt: payload.metadata.createdAt,
            reason: payload.metadata.reason,
            relativePath: blob.pathname
          };
        })
      );
    } catch (error) {
      console.error("Failed to list Vercel Blob backups", error);
      return [];
    }
  }

  try {
    const yearDirs = await readdir(backupsRoot, { withFileTypes: true });
    const files: string[] = [];

    for (const yearDir of yearDirs.filter((entry) => entry.isDirectory())) {
      const yearPath = path.join(backupsRoot, yearDir.name);
      const monthDirs = await readdir(yearPath, { withFileTypes: true });

      for (const monthDir of monthDirs.filter((entry) => entry.isDirectory())) {
        const monthPath = path.join(yearPath, monthDir.name);
        const monthFiles = await readdir(monthPath, { withFileTypes: true });

        for (const file of monthFiles.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))) {
          files.push(path.join(monthPath, file.name));
        }
      }
    }

    const sorted = files.sort((left, right) => right.localeCompare(left)).slice(0, limit);

    return Promise.all(
      sorted.map(async (filePath) => {
        const raw = await readFile(filePath, "utf-8");
        const payload = JSON.parse(raw) as BackupEnvelope;

        return {
          counts: payload.metadata.counts,
          createdAt: payload.metadata.createdAt,
          reason: payload.metadata.reason,
          relativePath: path.relative(process.env.VERCEL === "1" ? os.tmpdir() : process.cwd(), filePath).replace(/\\/g, "/")
        };
      })
    );
  } catch {
    return [];
  }
}

export async function wipeDatabase() {
  return prisma.$transaction(async (tx) => {
    await tx.answerAttachment.deleteMany();
    await tx.manualCorrection.deleteMany();
    await tx.feedbackAnswer.deleteMany();
    await tx.feedbackFormResponse.deleteMany();
    await tx.answer.deleteMany();
    await tx.studentProfileSnapshot.deleteMany();
    await tx.issueReport.deleteMany();
    await tx.studentAttempt.deleteMany();
    await tx.publicExamLink.deleteMany();
    await tx.reportShareLink.deleteMany();
    await tx.examQuestion.deleteMany();
    await tx.examSection.deleteMany();
    await tx.examTheme.deleteMany();
    await tx.questionTag.deleteMany();
    await tx.questionTheme.deleteMany();
    await tx.questionOption.deleteMany();
    await tx.exam.deleteMany();
    await tx.question.deleteMany();
    await tx.tag.deleteMany();
    await tx.theme.deleteMany();
    await tx.classGroup.deleteMany();
    await tx.discipline.deleteMany();
  });
}
