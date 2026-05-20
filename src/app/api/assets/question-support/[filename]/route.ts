import { NextRequest, NextResponse } from "next/server";
import { readQuestionSupportAsset } from "@/server/uploads";
import { prisma } from "@/server/db/prisma";
import { readFile } from "fs/promises";
import path from "path";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

async function readBundledQuestionSupportAsset(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  return readFile(path.join(process.cwd(), "public", "assets", "question-support", safeName));
}

export async function GET(_: NextRequest, context: RouteContext) {
  const { filename } = await context.params;

  try {
    let buffer: Buffer;

    try {
      buffer = await readQuestionSupportAsset(filename);
    } catch {
      buffer = await readBundledQuestionSupportAsset(filename);
    }

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

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
