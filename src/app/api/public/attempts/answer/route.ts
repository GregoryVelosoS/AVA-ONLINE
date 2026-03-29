import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { answerSchema } from "@/server/validators/schemas";
import { scoreObjectiveAnswer, recomputeAttemptScore } from "@/server/services/scoring";
import { isAttemptTimeExpired } from "@/server/services/attempts";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: parsed.data.attemptId },
    include: {
      exam: true
    }
  });

  if (!attempt || attempt.status === "SUBMITTED") {
    return NextResponse.json({ error: "Tentativa inválida" }, { status: 400 });
  }

  if (isAttemptTimeExpired(attempt)) {
    return NextResponse.json({ error: "O tempo da prova se esgotou." }, { status: 409 });
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

  if (attempt.status === "STARTED") {
    await prisma.studentAttempt.update({
      where: { id: parsed.data.attemptId },
      data: {
        status: "IN_PROGRESS"
      }
    });
  }

  await scoreObjectiveAnswer(answer.id);
  await recomputeAttemptScore(parsed.data.attemptId);

  return NextResponse.json({ ok: true });
}
