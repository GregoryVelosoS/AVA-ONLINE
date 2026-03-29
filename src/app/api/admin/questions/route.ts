import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { questionSchema } from "@/server/validators/schemas";

export async function GET() {
  await requireAdminSession();

  const data = await prisma.question.findMany({
    include: {
      discipline: true,
      options: { orderBy: { position: "asc" } },
      tags: { include: { tag: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.question.create({
    data: {
      code: parsed.data.code,
      title: parsed.data.title || null,
      type: parsed.data.type,
      disciplineId: parsed.data.disciplineId,
      subject: parsed.data.subject,
      topic: parsed.data.topic || null,
      difficulty: parsed.data.difficulty,
      context: parsed.data.context || null,
      statement: parsed.data.statement,
      visualSupportType: parsed.data.visualSupportType,
      supportCode: parsed.data.supportCode || null,
      expectedFeedback: parsed.data.expectedFeedback || null,
      answerExplanation: parsed.data.answerExplanation || null,
      studyTopics: parsed.data.studyTopics || null,
      studyLinks: parsed.data.studyLinks || null,
      referencePlaylist: parsed.data.referencePlaylist || null,
      complementaryNotes: parsed.data.complementaryNotes || null,
      supportImagePath: parsed.data.supportImagePath || null,
      supportImageName: parsed.data.supportImageName || null,
      supportImageMime: parsed.data.supportImageMime || null,
      supportFilePath: parsed.data.supportFilePath || null,
      supportFileName: parsed.data.supportFileName || null,
      supportFileMime: parsed.data.supportFileMime || null,
      defaultWeight: parsed.data.defaultWeight,
      status: parsed.data.status,
      createdBy: session.sub,
      options:
        parsed.data.type === "MULTIPLE_CHOICE"
          ? {
              create: parsed.data.options.map((option) => ({
                label: option.label,
                content: option.content,
                isCorrect: option.isCorrect,
                position: option.position
              }))
            }
          : undefined
    },
    include: {
      discipline: true,
      options: { orderBy: { position: "asc" } }
    }
  });

  return NextResponse.json(created, { status: 201 });
}
