import { prisma } from "@/server/db/prisma";
import { getQuestionStudyTopics } from "@/lib/question-feedback";
import { parseSelections } from "@/lib/feedback-questionnaire";

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

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentage(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function computeCorrelation(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return 0;
  }

  const xAvg = average(points.map((point) => point.x));
  const yAvg = average(points.map((point) => point.y));

  const numerator = points.reduce((sum, point) => sum + (point.x - xAvg) * (point.y - yAvg), 0);
  const xVariance = points.reduce((sum, point) => sum + (point.x - xAvg) ** 2, 0);
  const yVariance = points.reduce((sum, point) => sum + (point.y - yAvg) ** 2, 0);

  if (xVariance === 0 || yVariance === 0) {
    return 0;
  }

  return numerator / Math.sqrt(xVariance * yVariance);
}

function getScoreBandLabel(scorePercent: number) {
  if (scorePercent < 50) return "0-49%";
  if (scorePercent < 70) return "50-69%";
  if (scorePercent < 85) return "70-84%";
  return "85-100%";
}

export async function getDashboardOverview() {
  const [totalExams, attempts, submitted] = await Promise.all([
    prisma.exam.count(),
    prisma.studentAttempt.findMany({
      include: {
        answers: true
      }
    }),
    prisma.studentAttempt.count({ where: { status: "SUBMITTED" } })
  ]);

  const totalStudents = attempts.length;
  const completionRate = totalStudents ? (submitted / totalStudents) * 100 : 0;
  const scores = attempts.map((attempt) => asNumber(attempt.finalScore));
  const avgScore = average(scores);
  const avgDurationSeconds = average(attempts.map((attempt) => attempt.durationSeconds || 0));

  return {
    totalExams,
    totalStudents,
    completionRate,
    avgScore,
    avgDurationSeconds
  };
}

export type ExamAnalyticsFilters = {
  examId?: string;
  classGroupId?: string;
  disciplineId?: string;
  student?: string;
  questionId?: string;
  level?: string;
  tagId?: string;
  performance?: string;
  scoreBand?: string;
};

export async function getExamAnalytics(filters: ExamAnalyticsFilters) {
  const [exams, selectedClassGroup] = await Promise.all([
    prisma.exam.findMany({
      include: {
        discipline: true,
        classGroup: true
      },
      orderBy: { createdAt: "desc" }
    }),
    filters.classGroupId
      ? prisma.classGroup.findUnique({
          where: { id: filters.classGroupId }
        })
      : Promise.resolve(null)
  ]);

  const selectedExamId = filters.examId || exams[0]?.id || null;
  if (!selectedExamId) {
    return {
      exams: [],
      selectedExam: null,
      filterOptions: { questions: [], students: [], tags: [] },
      summary: null,
      scoreDistribution: [],
      completionBreakdown: [],
      questionPerformance: [],
      questionHighlights: null,
      levelPerformance: [],
      tagPerformance: [],
      studentRanking: [],
      topStudents: [],
      strugglingStudents: [],
      studentDetail: null,
      pedagogicalInsights: {
        lowPerformanceCount: 0,
        belowAverageCount: 0,
        fragileContents: [],
        difficultyByTheme: [],
        retomadaPoints: []
      },
      feedbackAnalytics: {
        responseCount: 0,
        scaleAverages: [],
        difficultContents: [],
        helpfulFormats: [],
        toolDifficulties: [],
        needReviewCounts: [],
        openComments: [],
        perceptionCorrelation: 0
      }
    };
  }

  const exam = await prisma.exam.findUnique({
    where: { id: selectedExamId },
    include: {
      discipline: true,
      classGroup: true,
      questions: {
        include: {
          question: {
            include: {
              discipline: true,
              tags: {
                include: {
                  tag: true
                }
              },
              themes: {
                include: {
                  theme: true
                }
              },
              options: {
                orderBy: { position: "asc" }
              }
            }
          }
        },
        orderBy: { position: "asc" }
      },
      attempts: {
        include: {
          profile: true,
          answers: {
            include: {
              question: {
                include: {
                  themes: {
                    include: {
                      theme: true
                    }
                  }
                }
              },
              selectedOption: true
            }
          },
          feedback: {
            include: {
              answers: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!exam) {
    return {
      exams: exams.map((item) => ({
        id: item.id,
        title: item.title,
        disciplineName: item.discipline.name,
        classGroupName: item.classGroup?.name ?? null
      })),
      selectedExam: null,
      filterOptions: { questions: [], students: [], tags: [] },
      summary: null,
      scoreDistribution: [],
      completionBreakdown: [],
      questionPerformance: [],
      questionHighlights: null,
      levelPerformance: [],
      tagPerformance: [],
      studentRanking: [],
      topStudents: [],
      strugglingStudents: [],
      studentDetail: null,
      pedagogicalInsights: {
        lowPerformanceCount: 0,
        belowAverageCount: 0,
        fragileContents: [],
        difficultyByTheme: [],
        retomadaPoints: []
      },
      feedbackAnalytics: {
        responseCount: 0,
        scaleAverages: [],
        difficultContents: [],
        helpfulFormats: [],
        toolDifficulties: [],
        needReviewCounts: [],
        openComments: [],
        perceptionCorrelation: 0
      }
    };
  }

  const examQuestions = exam.questions.map((item) => item.question);
  const maxScore = exam.questions.reduce((sum, item) => sum + asNumber(item.customWeight ?? item.question.defaultWeight), 0);

  let baseAttempts = exam.attempts.filter((attempt) => {
    if (filters.disciplineId && exam.disciplineId !== filters.disciplineId) {
      return false;
    }

    if (selectedClassGroup && attempt.profile?.classGroupName !== selectedClassGroup.name) {
      return false;
    }

    if (filters.student) {
      const studentName = attempt.profile?.studentName || "";
      if (!studentName.toLowerCase().includes(filters.student.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const baseStudentRows = baseAttempts.map((attempt) => {
    const correctCount = attempt.answers.filter((answer) => answer.isCorrect === true).length;
    const incorrectCount = attempt.answers.filter((answer) => answer.isCorrect === false).length;
    const answeredCount = attempt.answers.length;
    const score = asNumber(attempt.finalScore);
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return {
      attemptId: attempt.id,
      studentName: attempt.profile?.studentName || "Aluno sem identificação",
      classGroupName: attempt.profile?.classGroupName || "Sem turma",
      disciplineInformed: attempt.profile?.disciplineInformed || exam.discipline.name,
      status: attempt.status,
      score: round(score, 2),
      scorePercent: round(scorePercent, 1),
      durationMinutes: round((attempt.durationSeconds || 0) / 60, 1),
      answeredCount,
      correctCount,
      incorrectCount,
      accuracy: round(percentage(correctCount, correctCount + incorrectCount), 1),
      feedback: attempt.feedback
    };
  });

  const baseAverageScore = average(baseStudentRows.map((row) => row.scorePercent));

  const attempts = baseAttempts.filter((attempt) => {
    const score = asNumber(attempt.finalScore);
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;

    if (filters.performance === "below-average" && scorePercent >= baseAverageScore) {
      return false;
    }

    if (filters.performance === "low-performance" && scorePercent >= 50) {
      return false;
    }

    if (filters.performance === "high-performance" && scorePercent < 85) {
      return false;
    }

    if (filters.scoreBand && filters.scoreBand !== "all" && getScoreBandLabel(scorePercent) !== filters.scoreBand) {
      return false;
    }

    return true;
  });

  const selectedTagId = filters.tagId || "";
  const filteredQuestions = exam.questions.filter((examQuestion) => {
    const question = examQuestion.question;

    if (filters.questionId && question.id !== filters.questionId) {
      return false;
    }

    if (filters.level && question.difficulty !== filters.level) {
      return false;
    }

    if (selectedTagId && !question.tags.some((tag) => tag.tagId === selectedTagId)) {
      return false;
    }

    return true;
  });

  const selectedQuestionIds = new Set(filteredQuestions.map((item) => item.questionId));
  const studentRows = attempts.map((attempt) => {
    const answers = attempt.answers.filter((answer) => !filters.questionId || selectedQuestionIds.has(answer.questionId));
    const correctCount = answers.filter((answer) => answer.isCorrect === true).length;
    const incorrectCount = answers.filter((answer) => answer.isCorrect === false).length;
    const score = asNumber(attempt.finalScore);
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const feedbackAnswers = Object.fromEntries(
      (attempt.feedback?.answers || []).map((answer) => [answer.questionKey, answer])
    );

    return {
      attemptId: attempt.id,
      studentName: attempt.profile?.studentName || "Aluno sem identificação",
      classGroupName: attempt.profile?.classGroupName || "Sem turma",
      disciplineInformed: attempt.profile?.disciplineInformed || exam.discipline.name,
      status: attempt.status,
      score: round(score, 2),
      scorePercent: round(scorePercent, 1),
      durationMinutes: round((attempt.durationSeconds || 0) / 60, 1),
      correctCount,
      incorrectCount,
      accuracy: round(percentage(correctCount, correctCount + incorrectCount), 1),
      answeredCount: answers.length,
      feedbackAnswers,
      attempt
    };
  });

  const submittedCount = attempts.filter((attempt) => attempt.status === "SUBMITTED").length;
  const scores = studentRows.map((row) => row.score);
  const scorePercents = studentRows.map((row) => row.scorePercent);
  const avgScorePercent = average(scorePercents);

  const relevantAnswers = attempts.flatMap((attempt) =>
    attempt.answers.filter((answer) => !filters.questionId || selectedQuestionIds.has(answer.questionId))
  );
  const objectiveAnswers = relevantAnswers.filter((answer) => answer.question.type === "MULTIPLE_CHOICE");
  const correctObjectiveAnswers = objectiveAnswers.filter((answer) => answer.isCorrect === true).length;
  const avgDurationMinutes = average(studentRows.map((row) => row.durationMinutes));

  const scoreDistributionMap = new Map<string, number>();
  studentRows.forEach((row) => {
    const label = getScoreBandLabel(row.scorePercent);
    scoreDistributionMap.set(label, (scoreDistributionMap.get(label) || 0) + 1);
  });

  const questionPerformance = filteredQuestions
    .map((examQuestion) => {
      const question = examQuestion.question;
      const answers = attempts.flatMap((attempt) => attempt.answers.filter((answer) => answer.questionId === question.id));
      const correctCount = answers.filter((answer) => answer.isCorrect === true).length;
      const incorrectCount = answers.filter((answer) => answer.isCorrect === false).length;
      const pendingCount = answers.length - correctCount - incorrectCount;
      const accuracy = percentage(correctCount, correctCount + incorrectCount);

      return {
        id: question.id,
        code: question.code,
        statement: question.statement,
        difficulty: question.difficulty,
        tags: question.tags.map((tag) => tag.tag.label),
        subject: question.subject,
        topic: question.topic,
        accuracy: round(accuracy, 1),
        errorRate: round(percentage(incorrectCount, correctCount + incorrectCount), 1),
        correctCount,
        incorrectCount,
        pendingCount
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  const levelPerformanceMap = new Map<string, { correct: number; total: number }>();
  const tagPerformanceMap = new Map<string, { correct: number; total: number }>();
  const themeWeaknessMap = new Map<string, number>();

  filteredQuestions.forEach((examQuestion) => {
    const question = examQuestion.question;
    const answers = attempts.flatMap((attempt) => attempt.answers.filter((answer) => answer.questionId === question.id));
    const correctCount = answers.filter((answer) => answer.isCorrect === true).length;
    const total = answers.filter((answer) => answer.isCorrect !== null).length;

    const levelEntry = levelPerformanceMap.get(question.difficulty) || { correct: 0, total: 0 };
    levelEntry.correct += correctCount;
    levelEntry.total += total;
    levelPerformanceMap.set(question.difficulty, levelEntry);

    question.tags.forEach((tagRelation) => {
      const tagEntry = tagPerformanceMap.get(tagRelation.tag.label) || { correct: 0, total: 0 };
      tagEntry.correct += correctCount;
      tagEntry.total += total;
      tagPerformanceMap.set(tagRelation.tag.label, tagEntry);
    });

    const studyTopics = uniqueByValue([
      ...question.themes.map((item) => item.theme.name),
      ...getQuestionStudyTopics({
        studyTopics: question.studyTopics,
        subject: question.subject,
        topic: question.topic
      })
    ]);
    const incorrectCount = answers.filter((answer) => answer.isCorrect === false).length;
    studyTopics.forEach((topic) => {
      themeWeaknessMap.set(topic, (themeWeaknessMap.get(topic) || 0) + incorrectCount);
    });
  });

  const feedbackResponses = attempts.map((attempt) => ({
    attemptId: attempt.id,
    studentName: attempt.profile?.studentName || "Aluno",
    scorePercent: maxScore > 0 ? (asNumber(attempt.finalScore) / maxScore) * 100 : 0,
    answers: Object.fromEntries((attempt.feedback?.answers || []).map((answer) => [answer.questionKey, answer]))
  }));

  const feedbackScaleDefinitions = [
    { key: "GENERAL_DIFFICULTY", label: "Dificuldade percebida" },
    { key: "SELF_PERFORMANCE", label: "Autopercepção de desempenho" },
    { key: "EXPLANATION_CLARITY", label: "Clareza das explicações" },
    { key: "CLASS_PACE", label: "Ritmo das aulas" },
    { key: "EXERCISE_USEFULNESS", label: "Utilidade dos exercícios" },
    { key: "SOLO_CONFIDENCE", label: "Segurança para resolver sozinho" }
  ] as const;

  const scaleAverages = feedbackScaleDefinitions.map((definition) => {
    const values = feedbackResponses
      .map((response) => response.answers[definition.key]?.valueScale || null)
      .filter((value): value is number => value != null);

    return {
      key: definition.key,
      label: definition.label,
      average: round(average(values), 2)
    };
  });

  const difficultContentsMap = new Map<string, number>();
  const helpfulFormatsMap = new Map<string, number>();
  const toolDifficultiesMap = new Map<string, number>();
  const needReviewMap = new Map<string, number>();
  const openComments = feedbackResponses
    .map((response) => ({
      studentName: response.studentName,
      comment: response.answers.FINAL_COMMENT?.valueText?.trim() || ""
    }))
    .filter((item) => item.comment);

  feedbackResponses.forEach((response) => {
    parseSelections(response.answers.DIFFICULT_CONTENTS?.selectedOptions).forEach((item) => {
      difficultContentsMap.set(item, (difficultContentsMap.get(item) || 0) + 1);
    });
    parseSelections(response.answers.HELPFUL_CLASS_FORMATS?.selectedOptions).forEach((item) => {
      helpfulFormatsMap.set(item, (helpfulFormatsMap.get(item) || 0) + 1);
    });
    parseSelections(response.answers.TOOL_DIFFICULTIES?.selectedOptions).forEach((item) => {
      toolDifficultiesMap.set(item, (toolDifficultiesMap.get(item) || 0) + 1);
    });

    const reviewValue = response.answers.NEEDS_REVIEW?.valueText;
    if (reviewValue) {
      needReviewMap.set(reviewValue, (needReviewMap.get(reviewValue) || 0) + 1);
    }
  });

  const perceptionCorrelation = computeCorrelation(
    feedbackResponses
      .map((response) => ({
        x: response.answers.SELF_PERFORMANCE?.valueScale || 0,
        y: response.scorePercent
      }))
      .filter((point) => point.x > 0)
  );

  const studentDetail =
    filters.student && studentRows.length > 0
      ? (() => {
          const detail = studentRows[0];
          const attempt = detail.attempt;
          const weakTopics = uniqueByValue(
            attempt.answers
              .filter((answer) => answer.isCorrect === false)
              .flatMap((answer) =>
                uniqueByValue([
                  ...answer.question.themes.map((item) => item.theme.name),
                  ...getQuestionStudyTopics({
                    studyTopics: answer.question.studyTopics,
                    subject: answer.question.subject,
                    topic: answer.question.topic
                  })
                ])
              )
          );

          const suggestedMaterials = uniqueByValue(
            attempt.answers
              .filter((answer) => answer.isCorrect === false)
              .flatMap((answer) => [
                ...(answer.question.studyLinks ? answer.question.studyLinks.split(/\r?\n|;/) : []),
                ...(answer.question.referencePlaylist ? [answer.question.referencePlaylist] : [])
              ])
              .map((item) => item.trim())
              .filter(Boolean)
          );

          return {
            studentName: detail.studentName,
            classGroupName: detail.classGroupName,
            score: detail.score,
            scorePercent: detail.scorePercent,
            correctCount: detail.correctCount,
            incorrectCount: detail.incorrectCount,
            accuracy: detail.accuracy,
            durationMinutes: detail.durationMinutes,
            weakTopics,
            suggestedMaterials,
            feedbackSummary: {
              generalDifficulty: detail.feedbackAnswers.GENERAL_DIFFICULTY?.valueScale || null,
              needsReview: detail.feedbackAnswers.NEEDS_REVIEW?.valueText || null,
              finalComment: detail.feedbackAnswers.FINAL_COMMENT?.valueText || null
            },
            questionBreakdown: exam.questions.map((examQuestion) => {
              const answer = attempt.answers.find((item) => item.questionId === examQuestion.questionId);
              return {
                code: examQuestion.question.code,
                statement: examQuestion.question.statement,
                isCorrect: answer?.isCorrect,
                confidenceLevel: answer?.confidenceLevel ?? null
              };
            })
          };
        })()
      : null;

  const lowPerformanceCount = studentRows.filter((row) => row.scorePercent < 50).length;
  const belowAverageCount = studentRows.filter((row) => row.scorePercent < avgScorePercent).length;
  const fragileContents = Array.from(themeWeaknessMap.entries())
    .map(([topic, errors]) => ({ topic, errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 8);

  const avgClarity = scaleAverages.find((item) => item.key === "EXPLANATION_CLARITY")?.average || 0;
  const avgGeneralDifficulty = scaleAverages.find((item) => item.key === "GENERAL_DIFFICULTY")?.average || 0;
  const topFragileTopics = fragileContents.slice(0, 3).map((item) => item.topic);

  return {
    exams: exams.map((item) => ({
      id: item.id,
      title: item.title,
      disciplineName: item.discipline.name,
      classGroupName: item.classGroup?.name ?? null
    })),
    selectedExam: {
      id: exam.id,
      title: exam.title,
      publicCode: exam.publicCode,
      disciplineName: exam.discipline.name,
      classGroupName: exam.classGroup?.name ?? null,
      status: exam.status,
      timeLimitMinutes: exam.timeLimitMinutes
    },
    filterOptions: {
      questions: examQuestions.map((question) => ({
        id: question.id,
        label: `${question.code} · ${question.statement}`
      })),
      students: studentRows.map((row) => ({
        id: row.attemptId,
        label: row.studentName
      })),
      tags: uniqueByValue(
        examQuestions.flatMap((question) => question.tags.map((tagRelation) => `${tagRelation.tagId}::${tagRelation.tag.label}`))
      ).map((item) => {
        const [id, label] = item.split("::");
        return { id, label };
      })
    },
    summary: {
      totalRespondents: attempts.length,
      completedStudents: submittedCount,
      averageScore: round(average(scores), 2),
      highestScore: round(scores.length > 0 ? Math.max(...scores) : 0, 2),
      lowestScore: round(scores.length > 0 ? Math.min(...scores) : 0, 2),
      averageScorePercent: round(avgScorePercent, 1),
      accuracyRate: round(percentage(correctObjectiveAnswers, objectiveAnswers.length), 1),
      averageDurationMinutes: round(avgDurationMinutes, 1),
      completionRate: round(percentage(submittedCount, attempts.length), 1)
    },
    scoreDistribution: Array.from(scoreDistributionMap.entries()).map(([label, value]) => ({ label, value })),
    completionBreakdown: [
      { name: "Concluíram", value: submittedCount },
      { name: "Em andamento", value: Math.max(0, attempts.length - submittedCount) }
    ],
    questionPerformance,
    questionHighlights: questionPerformance.length
      ? {
          criticalQuestion: questionPerformance[0],
          easiestQuestion: [...questionPerformance].sort((a, b) => b.accuracy - a.accuracy)[0]
        }
      : null,
    levelPerformance: Array.from(levelPerformanceMap.entries()).map(([level, stats]) => ({
      level,
      accuracy: round(percentage(stats.correct, stats.total), 1)
    })),
    tagPerformance: Array.from(tagPerformanceMap.entries()).map(([tag, stats]) => ({
      tag,
      accuracy: round(percentage(stats.correct, stats.total), 1)
    })),
    studentRanking: [...studentRows].sort((a, b) => b.scorePercent - a.scorePercent).map(toPublicStudentRow),
    topStudents: [...studentRows]
      .sort((a, b) => b.scorePercent - a.scorePercent)
      .slice(0, 5)
      .map(toPublicStudentRow),
    strugglingStudents: [...studentRows]
      .sort((a, b) => a.scorePercent - b.scorePercent)
      .slice(0, 5)
      .map(toPublicStudentRow),
    studentDetail,
    pedagogicalInsights: {
      lowPerformanceCount,
      belowAverageCount,
      fragileContents,
      difficultyByTheme: Array.from(difficultContentsMap.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      retomadaPoints: [
        topFragileTopics.length > 0 ? `Retomar com prioridade os temas: ${topFragileTopics.join(", ")}.` : null,
        avgClarity < 3 ? "Reforçar explicações e exemplos guiados antes da próxima avaliação." : null,
        avgGeneralDifficulty >= 4 ? "Planejar revisão focada, pois a turma percebeu a prova como difícil." : null
      ].filter(Boolean)
    },
    feedbackAnalytics: {
      responseCount: feedbackResponses.filter((response) => Object.keys(response.answers).length > 0).length,
      scaleAverages,
      difficultContents: Array.from(difficultContentsMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      helpfulFormats: Array.from(helpfulFormatsMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      toolDifficulties: Array.from(toolDifficultiesMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      needReviewCounts: Array.from(needReviewMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      openComments: openComments.slice(0, 10),
      perceptionCorrelation: round(perceptionCorrelation, 2)
    }
  };
}

function uniqueByValue(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toPublicStudentRow<
  T extends {
    attemptId: string;
    studentName: string;
    classGroupName: string;
    disciplineInformed: string;
    status: string;
    score: number;
    scorePercent: number;
    durationMinutes: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    answeredCount: number;
  }
>(row: T) {
  return {
    attemptId: row.attemptId,
    studentName: row.studentName,
    classGroupName: row.classGroupName,
    disciplineInformed: row.disciplineInformed,
    status: row.status,
    score: row.score,
    scorePercent: row.scorePercent,
    durationMinutes: row.durationMinutes,
    correctCount: row.correctCount,
    incorrectCount: row.incorrectCount,
    accuracy: row.accuracy,
    answeredCount: row.answeredCount
  };
}

export type ExamAnalyticsResult = Awaited<ReturnType<typeof getExamAnalytics>>;
