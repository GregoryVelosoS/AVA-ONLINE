import { NextRequest, NextResponse } from "next/server";
import { getOptionalAdminSession, requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { issueReportSchema } from "@/server/validators/schemas";
import { saveIssueReportScreenshot } from "@/server/uploads";

const allowedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const maxFileSize = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const type = request.nextUrl.searchParams.get("type") || undefined;
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const page = request.nextUrl.searchParams.get("page") || undefined;

  const reports = await prisma.issueReport.findMany({
    where: {
      ...(type ? { type: type as "SUGGESTION" | "BUG" | "QUESTION" } : {}),
      ...(status ? { status: status as "NEW" | "IN_REVIEW" | "RESOLVED" | "ARCHIVED" } : {}),
      ...(page
        ? {
            sourcePath: {
              contains: page
            }
          }
        : {})
    },
    include: {
      adminUser: true,
      exam: true,
      attempt: {
        include: {
          profile: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const adminSession = await getOptionalAdminSession();
  const formData = await request.formData();

  const parsed = issueReportSchema.safeParse({
    type: String(formData.get("type") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    sourcePath: String(formData.get("sourcePath") || ""),
    sourceUrl: String(formData.get("sourceUrl") || ""),
    contextLabel: String(formData.get("contextLabel") || ""),
    examId: String(formData.get("examId") || ""),
    attemptId: String(formData.get("attemptId") || "")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const screenshot = formData.get("screenshot");
  let screenshotPayload:
    | {
        screenshotPath: string;
        screenshotName: string;
        screenshotMime: string;
      }
    | undefined;

  if (screenshot instanceof File && screenshot.size > 0) {
    if (!allowedImageTypes.includes(screenshot.type)) {
      return NextResponse.json({ error: "Envie uma imagem PNG, JPG, WEBP ou GIF." }, { status: 400 });
    }

    if (screenshot.size > maxFileSize) {
      return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });
    }

    const buffer = new Uint8Array(await screenshot.arrayBuffer());
    const fileName = await saveIssueReportScreenshot({
      data: buffer,
      originalName: screenshot.name
    });

    screenshotPayload = {
      screenshotPath: fileName,
      screenshotName: screenshot.name,
      screenshotMime: screenshot.type
    };
  }

  const created = await prisma.issueReport.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      sourcePath: parsed.data.sourcePath,
      sourceUrl: parsed.data.sourceUrl || null,
      contextLabel: parsed.data.contextLabel || null,
      examId: parsed.data.examId || null,
      attemptId: parsed.data.attemptId || null,
      adminUserId: adminSession?.sub ?? null,
      ...screenshotPayload
    }
  });

  return NextResponse.json(created, { status: 201 });
}
