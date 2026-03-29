import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
const questionSupportDir = path.join(uploadRoot, "question-support");
const issueReportsDir = path.join(uploadRoot, "issue-reports");

function sanitizeFileNamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "");
}

function getExtension(fileName: string) {
  const ext = path.extname(fileName);
  return ext ? ext.slice(0, 12) : "";
}

export function isExternalAssetPath(value?: string | null) {
  return Boolean(value && /^(https?:)?\/\//i.test(value));
}

export function getQuestionSupportAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (isExternalAssetPath(value)) {
    return value;
  }

  return `/api/assets/question-support/${value}`;
}

export async function ensureUploadDirectories() {
  await mkdir(questionSupportDir, { recursive: true });
  await mkdir(issueReportsDir, { recursive: true });
}

export async function saveQuestionSupportAsset(input: {
  data: Uint8Array;
  originalName: string;
  kind: "image" | "file";
}) {
  await ensureUploadDirectories();

  const extension = sanitizeFileNamePart(getExtension(input.originalName));
  const fileName = `${input.kind}-${randomUUID()}${extension}`;
  const target = path.join(questionSupportDir, fileName);

  await writeFile(target, input.data);

  return fileName;
}

export async function readQuestionSupportAsset(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  const target = path.join(questionSupportDir, safeName);
  return readFile(target);
}

export async function deleteManagedQuestionSupportAsset(fileName?: string | null) {
  if (!fileName || isExternalAssetPath(fileName)) {
    return;
  }

  const safeName = path.basename(fileName);
  if (safeName !== fileName) {
    return;
  }

  const target = path.join(questionSupportDir, safeName);
  await rm(target, { force: true });
}

export async function saveIssueReportScreenshot(input: {
  data: Uint8Array;
  originalName: string;
}) {
  await ensureUploadDirectories();

  const extension = sanitizeFileNamePart(getExtension(input.originalName));
  const fileName = `issue-${randomUUID()}${extension}`;
  const target = path.join(issueReportsDir, fileName);

  await writeFile(target, input.data);

  return fileName;
}

export async function readIssueReportScreenshot(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  const target = path.join(issueReportsDir, safeName);
  return readFile(target);
}

export async function deleteManagedIssueReportScreenshot(fileName?: string | null) {
  if (!fileName || isExternalAssetPath(fileName)) {
    return;
  }

  const safeName = path.basename(fileName);
  if (safeName !== fileName) {
    return;
  }

  const target = path.join(issueReportsDir, safeName);
  await rm(target, { force: true });
}
