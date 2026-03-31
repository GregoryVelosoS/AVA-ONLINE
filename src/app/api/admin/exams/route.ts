import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { getExamBindingValidationError } from "@/server/services/exam-bindings";
import { examSchema } from "@/server/validators/schemas";
import { normalizePublicCode } from "@/lib/exam-status";

function buildPublicSlug(publicCode: string) {
  return normalizePublicCode(publicCode).toLowerCase();
}

export async function GET() {
  await requireAdminSession();

  const data = await prisma.exam.findMany({
    include: {
      discipline: true,
      classGroup: true,
      themes: {
        include: {
          theme: true
        }
      },
      questions: {
        include: {
          question: {
            include: {
              discipline: true
            }
          }
        },
        orderBy: { position: "asc" }
      },
      publicLinks: true,
      attempts: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.status === "PUBLISHED" && parsed.data.questionIds.length === 0) {
    return NextResponse.json({ error: "Uma prova publicada precisa ter pelo menos uma questão." }, { status: 400 });
  }

  const publicCode = normalizePublicCode(parsed.data.publicCode);
  const existingCode = await prisma.exam.findUnique({
    where: { publicCode }
  });

  if (existingCode) {
    return NextResponse.json({ error: "Já existe uma prova com esse código público." }, { status: 409 });
  }

  const bindingError = await getExamBindingValidationError({
    disciplineId: parsed.data.disciplineId,
    targetClassGroupId: parsed.data.targetClassGroupId,
    themeIds: parsed.data.themeIds
  });

  if (bindingError) {
    return NextResponse.json({ error: bindingError }, { status: 400 });
  }

  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : new Date();
  const endAt = parsed.data.endAt
    ? new Date(parsed.data.endAt)
    : new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 30);

  const created = await prisma.exam.create({
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
      createdBy: session.sub,
      themes:
        parsed.data.themeIds.length > 0
          ? {
              create: Array.from(new Set(parsed.data.themeIds)).map((themeId) => ({
                themeId
              }))
            }
          : undefined,
      questions:
        parsed.data.questionIds.length > 0
          ? {
              create: parsed.data.questionIds.map((questionId, index) => ({
                questionId,
                position: index + 1
              }))
            }
          : undefined,
      publicLinks: {
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
      publicLinks: true
    }
  });

  return NextResponse.json(created, { status: 201 });
}
