import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { saveQuestionSupportAsset } from "@/server/uploads";

const imageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const fileMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain"
]);

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || (kind !== "image" && kind !== "file")) {
    return NextResponse.json({ error: "Upload inválido." }, { status: 400 });
  }

  const maxSize = kind === "image" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Arquivo excede o tamanho permitido." }, { status: 400 });
  }

  const validMimeTypes = kind === "image" ? imageMimeTypes : fileMimeTypes;
  if (!validMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido." }, { status: 400 });
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const storedPath = await saveQuestionSupportAsset({
    data,
    originalName: file.name,
    kind
  });

  return NextResponse.json({
    path: storedPath,
    name: file.name,
    mime: file.type
  });
}
