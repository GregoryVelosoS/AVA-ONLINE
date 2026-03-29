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

export function getAttemptDeadline(attempt: { startedAt: Date; exam: { timeLimitMinutes: number | null } }) {
  if (!attempt.exam.timeLimitMinutes) {
    return null;
  }

  return new Date(attempt.startedAt.getTime() + attempt.exam.timeLimitMinutes * 60 * 1000);
}

export function isAttemptTimeExpired(attempt: { startedAt: Date; exam: { timeLimitMinutes: number | null } }) {
  const deadline = getAttemptDeadline(attempt);
  if (!deadline) {
    return false;
  }

  return deadline.getTime() <= Date.now();
}

export async function finalizeAttempt(attemptId: string, feedback: AttemptFeedbackInput) {
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

  await prisma.studentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      durationSeconds: Math.max(0, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000))
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
