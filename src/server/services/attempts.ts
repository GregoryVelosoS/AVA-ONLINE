import { prisma } from "@/server/db/prisma";
import { recomputeAttemptScore } from "@/server/services/scoring";
import { serializeSelections } from "@/lib/feedback-questionnaire";

export type AttemptFeedbackInput = {
  generalDifficulty: number;
  difficultContents: string[];
  commonDifficultyType: string;
  selfPerformance: number;
  explanationClarity: number;
  classPace: number;
  exerciseUsefulness: number;
  soloConfidence: number;
  helpfulClassFormats: string[];
  needsReview: string;
  toolDifficulties: string[];
  finalComment?: string;
};

function buildFeedbackAnswers(feedback: AttemptFeedbackInput) {
  return [
    {
      questionKey: "GENERAL_DIFFICULTY" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.generalDifficulty
    },
    {
      questionKey: "DIFFICULT_CONTENTS" as const,
      answerType: "MULTI_SELECT" as const,
      selectedOptions: serializeSelections(feedback.difficultContents)
    },
    {
      questionKey: "COMMON_DIFFICULTY_TYPE" as const,
      answerType: "SINGLE_CHOICE" as const,
      valueText: feedback.commonDifficultyType
    },
    {
      questionKey: "SELF_PERFORMANCE" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.selfPerformance
    },
    {
      questionKey: "EXPLANATION_CLARITY" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.explanationClarity
    },
    {
      questionKey: "CLASS_PACE" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.classPace
    },
    {
      questionKey: "EXERCISE_USEFULNESS" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.exerciseUsefulness
    },
    {
      questionKey: "SOLO_CONFIDENCE" as const,
      answerType: "LINEAR_SCALE" as const,
      valueScale: feedback.soloConfidence
    },
    {
      questionKey: "HELPFUL_CLASS_FORMATS" as const,
      answerType: "MULTI_SELECT" as const,
      selectedOptions: serializeSelections(feedback.helpfulClassFormats)
    },
    {
      questionKey: "NEEDS_REVIEW" as const,
      answerType: "SINGLE_CHOICE" as const,
      valueText: feedback.needsReview
    },
    {
      questionKey: "TOOL_DIFFICULTIES" as const,
      answerType: "MULTI_SELECT" as const,
      selectedOptions: serializeSelections(feedback.toolDifficulties)
    },
    {
      questionKey: "FINAL_COMMENT" as const,
      answerType: "OPEN_TEXT" as const,
      valueText: feedback.finalComment || null
    }
  ];
}

export function getAttemptDeadline(attempt: { startedAt: Date; exam: { timeLimitMinutes: number | null; endAt?: Date } }) {
  const candidates: number[] = [];

  if (attempt.exam.timeLimitMinutes) {
    candidates.push(attempt.startedAt.getTime() + attempt.exam.timeLimitMinutes * 60 * 1000);
  }

  if (attempt.exam.endAt) {
    candidates.push(new Date(attempt.exam.endAt).getTime());
  }

  if (candidates.length === 0) {
    return null;
  }

  return new Date(Math.min(...candidates));
}

export function isAttemptTimeExpired(attempt: { startedAt: Date; exam: { timeLimitMinutes: number | null; endAt?: Date } }) {
  const deadline = getAttemptDeadline(attempt);
  if (!deadline) {
    return false;
  }

  return deadline.getTime() <= Date.now();
}

export async function autoCloseExpiredAttempts(examId?: string) {
  const now = new Date();

  const activeAttempts = await prisma.studentAttempt.findMany({
    where: {
      status: { in: ["STARTED", "IN_PROGRESS"] },
      ...(examId ? { examId } : {}),
      exam: {
        OR: [
          { timeLimitMinutes: { not: null } },
          { endAt: { lte: now } }
        ]
      }
    },
    include: {
      exam: true
    }
  });

  const expired = activeAttempts.filter((attempt) => isAttemptTimeExpired(attempt));

  let closedCount = 0;
  for (const attempt of expired) {
    try {
      const maxLimitSeconds = attempt.exam.timeLimitMinutes ? attempt.exam.timeLimitMinutes * 60 : null;
      let effectiveDuration: number;

      if (maxLimitSeconds != null) {
        effectiveDuration = maxLimitSeconds;
      } else if (attempt.exam.endAt) {
        effectiveDuration = Math.max(0, Math.floor((attempt.exam.endAt.getTime() - attempt.startedAt.getTime()) / 1000));
      } else {
        effectiveDuration = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));
      }

      await finalizeAttempt(attempt.id, timeoutFeedbackDefaults, effectiveDuration);
      closedCount += 1;
    } catch (error) {
      console.error(`Falha ao encerrar automaticamente tentativa expirada ${attempt.id}:`, error);
    }
  }

  return closedCount;
}

export async function finalizeAttempt(
  attemptId: string,
  feedback: AttemptFeedbackInput,
  explicitDurationSeconds?: number
) {
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: true
    }
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status === "SUBMITTED") {
    return attempt;
  }

  const answerRows = buildFeedbackAnswers(feedback);

  await prisma.feedbackFormResponse.upsert({
    where: { attemptId },
    update: {
      clarityScore: feedback.explanationClarity,
      difficultyScore: feedback.generalDifficulty,
      timeAdequacyScore: feedback.classPace,
      contentAlignmentScore: feedback.exerciseUsefulness,
      selfAssessmentScore: feedback.selfPerformance,
      confusingQuestionFlag: feedback.needsReview !== "Não, me sinto seguro",
      openComment: feedback.finalComment,
      answers: {
        deleteMany: {},
        create: answerRows
      }
    },
    create: {
      attemptId,
      clarityScore: feedback.explanationClarity,
      difficultyScore: feedback.generalDifficulty,
      timeAdequacyScore: feedback.classPace,
      contentAlignmentScore: feedback.exerciseUsefulness,
      selfAssessmentScore: feedback.selfPerformance,
      confusingQuestionFlag: feedback.needsReview !== "Não, me sinto seguro",
      openComment: feedback.finalComment,
      answers: {
        create: answerRows
      }
    }
  });

  const nowMs = Date.now();
  const rawElapsed = Math.max(0, Math.floor((nowMs - attempt.startedAt.getTime()) / 1000));
  const maxLimitSeconds = attempt.exam.timeLimitMinutes ? attempt.exam.timeLimitMinutes * 60 : null;

  let finalDurationSeconds: number;
  if (explicitDurationSeconds !== undefined) {
    finalDurationSeconds = maxLimitSeconds != null ? Math.min(explicitDurationSeconds, maxLimitSeconds) : explicitDurationSeconds;
  } else if (maxLimitSeconds != null) {
    finalDurationSeconds = Math.min(rawElapsed, maxLimitSeconds);
  } else {
    finalDurationSeconds = rawElapsed;
  }

  const submittedAt = new Date(attempt.startedAt.getTime() + finalDurationSeconds * 1000);

  await prisma.studentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt,
      durationSeconds: finalDurationSeconds
    }
  });

  await recomputeAttemptScore(attemptId);

  return attempt;
}

export const timeoutFeedbackDefaults: AttemptFeedbackInput = {
  generalDifficulty: 3,
  difficultContents: ["Tempo de prova"],
  commonDifficultyType: "Gestão do tempo",
  selfPerformance: 3,
  explanationClarity: 3,
  classPace: 3,
  exerciseUsefulness: 3,
  soloConfidence: 3,
  helpfulClassFormats: ["Aula expositiva"],
  needsReview: "Talvez, em tópicos específicos",
  toolDifficulties: [],
  finalComment: "Tentativa finalizada automaticamente por tempo esgotado."
};
