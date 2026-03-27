import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/server/db/prisma";

function asNumber(v: Decimal | number | null | undefined) {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export async function scoreObjectiveAnswer(answerId: string) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      question: { include: { options: true } },
      selectedOption: true
    }
  });

  if (!answer) return;

  let autoScore = 0;
  let isCorrect: boolean | null = null;

  if (answer.question.type === "MULTIPLE_CHOICE") {
    const correct = answer.question.options.find((o) => o.isCorrect);
    isCorrect = correct?.id === answer.selectedOptionId;
    autoScore = isCorrect ? asNumber(answer.question.defaultWeight) : 0;
  }

  await prisma.answer.update({
    where: { id: answer.id },
    data: {
      isCorrect,
      autoScore,
      finalScore: autoScore + asNumber(answer.manualScore)
    }
  });
}

export async function recomputeAttemptScore(attemptId: string) {
  const answers = await prisma.answer.findMany({ where: { attemptId } });

  const autoScore = answers.reduce((acc, cur) => acc + asNumber(cur.autoScore), 0);
  const manualScore = answers.reduce((acc, cur) => acc + asNumber(cur.manualScore), 0);
  const finalScore = autoScore + manualScore;

  await prisma.studentAttempt.update({
    where: { id: attemptId },
    data: {
      autoScore,
      manualScore,
      finalScore
    }
  });
}
