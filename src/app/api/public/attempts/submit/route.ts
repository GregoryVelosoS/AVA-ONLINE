import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { feedbackSchema } from "@/server/validators/schemas";
import { finalizeAttempt } from "@/server/services/attempts";

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

  await finalizeAttempt(parsed.data.attemptId, {
    generalDifficulty: parsed.data.generalDifficulty,
    difficultContents: parsed.data.difficultContents,
    commonDifficultyType: parsed.data.commonDifficultyType,
    selfPerformance: parsed.data.selfPerformance,
    explanationClarity: parsed.data.explanationClarity,
    classPace: parsed.data.classPace,
    exerciseUsefulness: parsed.data.exerciseUsefulness,
    soloConfidence: parsed.data.soloConfidence,
    helpfulClassFormats: parsed.data.helpfulClassFormats,
    needsReview: parsed.data.needsReview,
    toolDifficulties: parsed.data.toolDifficulties,
    finalComment: parsed.data.finalComment
  });

  return NextResponse.json({ ok: true });
}
