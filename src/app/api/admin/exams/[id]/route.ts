import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { getExamBindingValidationError } from "@/server/services/exam-bindings";
import { examSchema } from "@/server/validators/schemas";
import { normalizePublicCode } from "@/lib/exam-status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildPublicSlug(publicCode: string) {
  return normalizePublicCode(publicCode).toLowerCase();
}

export async function GET(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      discipline: true,
      classGroup: true,
      themes: {
        include: {
          theme: true
        }
      },
      publicLinks: true,
      questions: {
        include: {
          question: {
            include: {
              discipline: true
            }
          }
        },
        orderBy: { position: "asc" }
      }
    }
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  return NextResponse.json(exam);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const body = await request.json();
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.exam.findUnique({
    where: { id },
    include: { publicLinks: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  const publicCode = normalizePublicCode(parsed.data.publicCode);
  const duplicate = await prisma.exam.findFirst({
    where: {
      publicCode,
      NOT: {
        id
      }
    }
  });

  if (duplicate) {
    return NextResponse.json({ error: "Já existe outra prova com esse código público." }, { status: 409 });
  }

  const questionIds = parsed.data.questionIds;
  if (parsed.data.status === "PUBLISHED" && questionIds.length === 0) {
    return NextResponse.json({ error: "Uma prova publicada precisa ter pelo menos uma questão." }, { status: 400 });
  }

  const bindingError = await getExamBindingValidationError({
    disciplineId: parsed.data.disciplineId,
    targetClassGroupId: parsed.data.targetClassGroupId,
    themeIds: parsed.data.themeIds
  });

  if (bindingError) {
    return NextResponse.json({ error: bindingError }, { status: 400 });
  }

  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : existing.startAt;
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : existing.endAt;

  const updated = await prisma.exam.update({
    where: { id },
    data: {
      title: parsed.data.title,
      publicCode,
      description: parsed.data.description || null,
      disciplineId: parsed.data.disciplineId,
      targetClassGroupId: parsed.data.targetClassGroupId,
      instructions: parsed.data.instructions || "Leia com atenção e responda conforme orientado pelo professor.",
      startAt,
      endAt,
      timeLimitMinutes: parsed.data.timeLimitMinutes || null,
      status: parsed.data.status,
      maxAttempts: parsed.data.maxAttempts,
      themes: {
        deleteMany: {},
        ...(parsed.data.themeIds.length > 0
          ? {
              create: Array.from(new Set(parsed.data.themeIds)).map((themeId) => ({
                themeId
              }))
            }
          : {})
      },
      questions: {
        deleteMany: {},
        ...(questionIds.length > 0
          ? {
              create: questionIds.map((questionId, index) => ({
                questionId,
                position: index + 1
              }))
            }
          : {})
      },
      publicLinks: existing.publicLinks[0]
        ? {
            updateMany: {
              where: {},
              data: {
                slug: buildPublicSlug(publicCode),
                isActive: parsed.data.status === "PUBLISHED"
              }
            }
          }
        : {
            create: {
              slug: buildPublicSlug(publicCode),
              isActive: parsed.data.status === "PUBLISHED"
            }
          }
    },
    include: {
      discipline: true,
      classGroup: true,
      themes: {
        include: {
          theme: true
        }
      },
      publicLinks: true,
      questions: {
        include: {
          question: {
            include: {
              discipline: true
            }
          }
        },
        orderBy: { position: "asc" }
      }
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const existing = await prisma.exam.findUnique({
    where: { id },
    include: {
      attempts: {
        select: { id: true }
      }
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  if (existing.attempts.length > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir uma prova que já possui tentativas registradas." },
      { status: 409 }
    );
  }

  await prisma.exam.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
