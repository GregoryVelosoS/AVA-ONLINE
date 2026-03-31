import { prisma } from "@/server/db/prisma";
import { getQuestionSupportAssetUrl } from "@/lib/assets";
import { getQuestionStudyTopics, splitResourceText, uniqueValues } from "@/lib/question-feedback";

function asNumber(value: unknown) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && value && "toString" in value) {
    return Number(value.toString());
  }

  return Number(value);
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function computeDurationSeconds(startedAt: Date, submittedAt: Date | null, storedDurationSeconds: number | null) {
  if (typeof storedDurationSeconds === "number" && storedDurationSeconds >= 0) {
    return storedDurationSeconds;
  }

  const end = submittedAt ?? new Date();
  return Math.max(0, Math.round((end.getTime() - startedAt.getTime()) / 1000));
}

export type AttemptResultQuestion = {
  id: string;
  code: string;
  position: number;
  context: string | null;
  statement: string;
  type: "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
  visualSupportType: "NONE" | "ASSET" | "CODE";
  supportCode: string | null;
  supportImagePath: string | null;
  supportImageName: string | null;
  supportImageUrl: string | null;
  supportFilePath: string | null;
  supportFileName: string | null;
  supportFileUrl: string | null;
  expectedFeedback: string | null;
  answerExplanation: string | null;
  studyTopics: string[];
  studyLinks: string[];
  referencePlaylist: string | null;
  complementaryNotes: string | null;
  selectedOptionLabel: string | null;
  selectedOptionContent: string | null;
  correctOptionLabel: string | null;
  correctOptionContent: string | null;
  confidenceLevel: number | null;
  shortTextAnswer: string | null;
  longTextAnswer: string | null;
  resultStatus: "correct" | "incorrect" | "pending" | "unanswered";
  referenceLinks: string[];
  options: Array<{
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
  }>;
};

export type AttemptResultSummary = {
  id: string;
  resultLookupCode: string;
  status: "STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "CANCELED";
  startedAt: Date;
  submittedAt: Date | null;
  durationSeconds: number;
  exam: {
    id: string;
    title: string;
    publicCode: string;
    disciplineName: string;
    classGroupName: string;
    instructions: string;
    timeLimitMinutes: number | null;
  };
  profile: {
    studentName: string;
    classGroupId: string | null;
    classGroupName: string;
    disciplineId: string | null;
    disciplineInformed: string;
    attemptOrigin: string | null;
    contextValidationNote: string | null;
  } | null;
  totalScore: number;
  maxScore: number;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  pendingCount: number;
  unansweredCount: number;
  consolidatedTopics: string[];
  consolidatedLinks: string[];
  questionResults: AttemptResultQuestion[];
};

export async function getAttemptResultSummary(attemptId: string): Promise<AttemptResultSummary | null> {
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      profile: true,
      answers: {
        include: {
          selectedOption: true,
          question: {
            include: {
              options: {
                orderBy: { position: "asc" }
              },
              themes: {
                include: {
                  theme: true
                }
              }
            }
          }
        }
      },
      exam: {
        include: {
          discipline: true,
          classGroup: true,
          questions: {
            include: {
              question: {
                include: {
                  options: {
                    orderBy: { position: "asc" }
                  },
                  themes: {
                    include: {
                      theme: true
                    }
                  }
                }
              }
            },
            orderBy: { position: "asc" }
          }
        }
      }
    }
  });

  if (!attempt) {
    return null;
  }

  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  const totalScore = asNumber(attempt.finalScore);
  const maxScore = attempt.exam.questions.reduce((acc, examQuestion) => {
    const weight = examQuestion.customWeight ?? examQuestion.question.defaultWeight;
    return acc + asNumber(weight);
  }, 0);

  const questionResults: AttemptResultQuestion[] = attempt.exam.questions.map((examQuestion, index) => {
    const question = examQuestion.question;
    const answer = answerMap.get(question.id);
    const correctOption = question.options.find((option) => option.isCorrect) ?? null;
    const isObjective = question.type === "MULTIPLE_CHOICE";
    const isAnswered =
      Boolean(answer?.selectedOptionId) ||
      Boolean(answer?.shortTextAnswer) ||
      Boolean(answer?.longTextAnswer);

    let resultStatus: "correct" | "incorrect" | "pending" | "unanswered";
    if (!answer || !isAnswered) {
      resultStatus = "unanswered";
    } else if (isObjective) {
      resultStatus = answer.isCorrect ? "correct" : "incorrect";
    } else {
      resultStatus = "pending";
    }

    const studyTopics = uniqueValues([
      ...question.themes.map((item) => item.theme.name),
      ...getQuestionStudyTopics({
        studyTopics: question.studyTopics,
        subject: question.subject,
        topic: question.topic
      })
    ]);
    const studyLinks = splitResourceText(question.studyLinks);
    const referenceLinks = uniqueValues([
      ...studyLinks,
      ...(question.referencePlaylist ? [question.referencePlaylist] : [])
    ]);

    return {
      id: question.id,
      code: question.code,
      position: index + 1,
      context: question.context,
      statement: question.statement,
      type: question.type,
      visualSupportType: question.visualSupportType,
      supportCode: question.supportCode,
      supportImagePath: question.supportImagePath,
      supportImageName: question.supportImageName,
      supportImageUrl: getQuestionSupportAssetUrl(question.supportImagePath),
      supportFilePath: question.supportFilePath,
      supportFileName: question.supportFileName,
      supportFileUrl: getQuestionSupportAssetUrl(question.supportFilePath),
      expectedFeedback: question.expectedFeedback,
      answerExplanation: question.answerExplanation,
      studyTopics,
      studyLinks,
      referencePlaylist: question.referencePlaylist,
      complementaryNotes: question.complementaryNotes,
      selectedOptionLabel: answer?.selectedOption?.label ?? null,
      selectedOptionContent: answer?.selectedOption?.content ?? null,
      correctOptionLabel: correctOption?.label ?? null,
      correctOptionContent: correctOption?.content ?? null,
      confidenceLevel: answer?.confidenceLevel ?? null,
      shortTextAnswer: answer?.shortTextAnswer ?? null,
      longTextAnswer: answer?.longTextAnswer ?? null,
      resultStatus,
      referenceLinks,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        content: option.content,
        isCorrect: option.isCorrect
      }))
    };
  });

  const correctCount = questionResults.filter((question) => question.resultStatus === "correct").length;
  const incorrectCount = questionResults.filter((question) => question.resultStatus === "incorrect").length;
  const pendingCount = questionResults.filter((question) => question.resultStatus === "pending").length;
  const unansweredCount = questionResults.filter((question) => question.resultStatus === "unanswered").length;

  const studyCandidates = questionResults.filter(
    (question) => question.resultStatus !== "correct" || (question.confidenceLevel != null && question.confidenceLevel < 3)
  );

  return {
    id: attempt.id,
    resultLookupCode: attempt.resultLookupCode,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    durationSeconds: computeDurationSeconds(attempt.startedAt, attempt.submittedAt, attempt.durationSeconds),
    exam: {
      id: attempt.exam.id,
      title: attempt.exam.title,
      publicCode: attempt.exam.publicCode,
      disciplineName: attempt.exam.discipline.name,
      classGroupName: attempt.exam.classGroup.name,
      instructions: attempt.exam.instructions,
      timeLimitMinutes: attempt.exam.timeLimitMinutes
    },
    profile: attempt.profile
      ? {
          studentName: attempt.profile.studentName,
          classGroupId: attempt.profile.classGroupId,
          classGroupName: attempt.profile.classGroupName,
          disciplineId: attempt.profile.disciplineId,
          disciplineInformed: attempt.profile.disciplineInformed,
          attemptOrigin: attempt.profile.attemptOrigin,
          contextValidationNote: attempt.profile.contextValidationNote
        }
      : null,
    totalScore,
    maxScore,
    scorePercent: maxScore > 0 ? round((totalScore / maxScore) * 100, 1) : 0,
    correctCount,
    incorrectCount,
    pendingCount,
    unansweredCount,
    consolidatedTopics: uniqueValues(studyCandidates.flatMap((question) => question.studyTopics)),
    consolidatedLinks: uniqueValues(studyCandidates.flatMap((question) => question.referenceLinks)),
    questionResults
  };
}
