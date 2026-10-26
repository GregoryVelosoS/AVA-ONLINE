import { NextRequest, NextResponse } from "next/server";
import { readQuestionSupportAsset } from "@/server/uploads";
import { prisma } from "@/server/db/prisma";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

async function readBundledQuestionSupportAsset(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  return readFile(path.join(process.env.VERCEL === "1" ? os.tmpdir() : process.cwd(), "public", "assets", "question-support", safeName));
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

    let mimeType =
      question?.supportImagePath === filename
        ? question.supportImageMime
        : question?.supportFilePath === filename
          ? question.supportFileMime
          : null;

    if (!mimeType) {
      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".pdf") mimeType = "application/pdf";
      else mimeType = "application/octet-stream";
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
