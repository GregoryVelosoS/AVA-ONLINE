import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { questionImportSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = questionImportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.$transaction(
    parsed.data.questions.map((question) =>
      prisma.question.create({
        data: {
          code: question.code,
          title: question.title || null,
          type: question.type,
          disciplineId: question.disciplineId,
          subject: question.subject,
          topic: question.topic || null,
          difficulty: question.difficulty,
          context: question.context || null,
          statement: question.statement,
          visualSupportType: question.visualSupportType,
          supportCode: question.supportCode || null,
          expectedFeedback: question.expectedFeedback || null,
          answerExplanation: question.answerExplanation || null,
          studyTopics: question.studyTopics || null,
          studyLinks: question.studyLinks || null,
          referencePlaylist: question.referencePlaylist || null,
          complementaryNotes: question.complementaryNotes || null,
          supportImagePath: question.supportImagePath || null,
          supportImageName: question.supportImageName || null,
          supportImageMime: question.supportImageMime || null,
          supportFilePath: question.supportFilePath || null,
          supportFileName: question.supportFileName || null,
          supportFileMime: question.supportFileMime || null,
          defaultWeight: question.defaultWeight,
          status: question.status,
          createdBy: session.sub,
          options:
            question.type === "MULTIPLE_CHOICE"
              ? {
                  create: question.options.map((option) => ({
                    label: option.label,
                    content: option.content,
                    isCorrect: option.isCorrect,
                    position: option.position
                  }))
                }
              : undefined
        }
      })
    )
  );

  return NextResponse.json({ count: created.length }, { status: 201 });
}
