import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { readIssueReportScreenshot } from "@/server/uploads";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { filename } = await context.params;

  const issue = await prisma.issueReport.findFirst({
    where: {
      screenshotPath: filename
    }
  });

  if (!issue) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  try {
    const buffer = await readIssueReportScreenshot(filename);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": issue.screenshotMime || "application/octet-stream",
        "Cache-Control": "private, max-age=60"
      }
    });
  } catch {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }
}
