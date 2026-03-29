import { NextRequest, NextResponse } from "next/server";
import { readQuestionSupportAsset } from "@/server/uploads";
import { prisma } from "@/server/db/prisma";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { filename } = await context.params;

  try {
    const buffer = await readQuestionSupportAsset(filename);
    const question = await prisma.question.findFirst({
      where: {
        OR: [{ supportImagePath: filename }, { supportFilePath: filename }]
      },
      select: {
        supportImagePath: true,
        supportImageMime: true,
        supportFilePath: true,
        supportFileMime: true
      }
    });

    const mimeType =
      question?.supportImagePath === filename
        ? question.supportImageMime
        : question?.supportFilePath === filename
          ? question.supportFileMime
          : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
