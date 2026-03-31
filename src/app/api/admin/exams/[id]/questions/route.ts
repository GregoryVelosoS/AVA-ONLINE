import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const examQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid())
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const body = await request.json();
  const parsed = examQuestionsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id }
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  const updated = await prisma.exam.update({
    where: { id },
    data: {
      questions: {
        deleteMany: {},
        ...(parsed.data.questionIds.length > 0
          ? {
              create: parsed.data.questionIds.map((questionId, index) => ({
                questionId,
                position: index + 1
              }))
            }
          : {})
      }
    },
    include: {
      questions: {
        include: {
          question: true
        },
        orderBy: { position: "asc" }
      }
    }
  });

  return NextResponse.json(updated);
}
