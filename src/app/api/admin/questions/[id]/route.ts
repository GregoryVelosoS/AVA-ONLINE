import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { questionSchema } from "@/server/validators/schemas";
import { deleteManagedQuestionSupportAsset } from "@/server/uploads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      discipline: true,
      options: { orderBy: { position: "asc" } },
      themes: {
        include: {
          theme: true
        }
      }
    }
  });

  if (!question) {
    return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 });
  }

  return NextResponse.json(question);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.question.findUnique({
    where: { id },
    include: { options: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 });
  }

  const oldImagePath = existing.supportImagePath;
  const oldFilePath = existing.supportFilePath;

  if (parsed.data.themeIds.length > 0) {
    const themeCount = await prisma.theme.count({
      where: {
        id: {
          in: Array.from(new Set(parsed.data.themeIds))
        }
      }
    });

    if (themeCount !== Array.from(new Set(parsed.data.themeIds)).length) {
      return NextResponse.json({ error: "Um ou mais temas selecionados não foram encontrados." }, { status: 400 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.questionOption.deleteMany({
      where: { questionId: id }
    });

    await tx.questionTheme.deleteMany({
      where: { questionId: id }
    });

    return tx.question.update({
      where: { id },
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
        themes:
          parsed.data.themeIds.length > 0
            ? {
                create: Array.from(new Set(parsed.data.themeIds)).map((themeId) => ({
                  themeId
                }))
              }
            : undefined,
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
        options: { orderBy: { position: "asc" } },
        themes: {
          include: {
            theme: true
          }
        }
      }
    });
  });

  if (oldImagePath && oldImagePath !== parsed.data.supportImagePath) {
    await deleteManagedQuestionSupportAsset(oldImagePath);
  }

  if (oldFilePath && oldFilePath !== parsed.data.supportFilePath) {
    await deleteManagedQuestionSupportAsset(oldFilePath);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const existing = await prisma.question.findUnique({
    where: { id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 });
  }

  try {
    await prisma.question.delete({
      where: { id }
    });

    await deleteManagedQuestionSupportAsset(existing.supportImagePath);
    await deleteManagedQuestionSupportAsset(existing.supportFilePath);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a questão. Verifique vínculos com provas ou respostas existentes." },
      { status: 409 }
    );
  }
}
