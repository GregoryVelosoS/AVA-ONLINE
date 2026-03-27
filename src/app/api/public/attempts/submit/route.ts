import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { feedbackSchema } from "@/server/validators/schemas";
import { recomputeAttemptScore } from "@/server/services/scoring";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attempt = await prisma.studentAttempt.findUnique({ where: { id: parsed.data.attemptId } });
  if (!attempt || attempt.status === "SUBMITTED") {
    return NextResponse.json({ error: "Tentativa inválida" }, { status: 400 });
  }

  await prisma.feedbackFormResponse.upsert({
    where: { attemptId: parsed.data.attemptId },
    update: {
      clarityScore: parsed.data.clarityScore,
      difficultyScore: parsed.data.difficultyScore,
      timeAdequacyScore: parsed.data.timeAdequacyScore,
      contentAlignmentScore: parsed.data.contentAlignmentScore,
      selfAssessmentScore: parsed.data.selfAssessmentScore,
      confusingQuestionFlag: parsed.data.confusingQuestionFlag,
      openComment: parsed.data.openComment
    },
    create: parsed.data
  });

  await prisma.studentAttempt.update({
    where: { id: parsed.data.attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      durationSeconds: Math.max(0, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000))
    }
  });

  await recomputeAttemptScore(parsed.data.attemptId);

  return NextResponse.json({ ok: true });
}
