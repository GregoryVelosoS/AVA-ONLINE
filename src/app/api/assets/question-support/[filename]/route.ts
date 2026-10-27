import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { filename } = await context.params;
  const safeName = path.basename(filename);

  if (safeName !== filename) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  // 1. Try to read directly from known storage folders on disk
  const candidatePaths = [
    path.join(process.cwd(), "public", "assets", "question-support", safeName),
    path.join(process.cwd(), "uploads", "question-support", safeName),
    path.join(os.tmpdir(), "question-support", safeName),
    path.join(os.tmpdir(), "uploads", "question-support", safeName)
  ];

  for (const candidate of candidatePaths) {
    try {
      const buffer = await readFile(candidate);

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
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    } catch {
      // Continue to next candidate
    }
  }

  // 2. On Vercel, static files in /public/ are served at the edge under /assets/question-support/
  // Redirect to the static CDN URL
  return NextResponse.redirect(new URL(`/assets/question-support/${safeName}`, request.url), 307);
}
