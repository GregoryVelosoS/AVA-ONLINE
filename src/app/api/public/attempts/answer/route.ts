import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { answerSchema } from "@/server/validators/schemas";
import { scoreObjectiveAnswer, recomputeAttemptScore } from "@/server/services/scoring";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attempt = await prisma.studentAttempt.findUnique({ where: { id: parsed.data.attemptId } });
  if (!attempt || attempt.status === "SUBMITTED") {
    return NextResponse.json({ error: "Tentativa inválida" }, { status: 400 });
  }

  const answer = await prisma.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: parsed.data.attemptId,
        questionId: parsed.data.questionId
      }
    },
    update: {
      selectedOptionId: parsed.data.selectedOptionId,
      shortTextAnswer: parsed.data.shortTextAnswer,
      longTextAnswer: parsed.data.longTextAnswer,
      confidenceLevel: parsed.data.confidenceLevel,
      answeredAt: new Date()
    },
    create: {
      attemptId: parsed.data.attemptId,
      questionId: parsed.data.questionId,
      selectedOptionId: parsed.data.selectedOptionId,
      shortTextAnswer: parsed.data.shortTextAnswer,
      longTextAnswer: parsed.data.longTextAnswer,
      confidenceLevel: parsed.data.confidenceLevel
    }
  });

  await scoreObjectiveAnswer(answer.id);
  await recomputeAttemptScore(parsed.data.attemptId);

  return NextResponse.json({ ok: true });
}
