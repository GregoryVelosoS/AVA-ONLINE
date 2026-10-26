import { prisma } from "@/server/db/prisma";
import { getExamDisplayStatus } from "@/lib/exam-status";
import { autoCloseExpiredAttempts } from "@/server/services/attempts";

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export async function getRealtimeMonitoring(examId?: string) {
  await autoCloseExpiredAttempts(examId);

  const now = new Date();
  const exams = await prisma.exam.findMany({
    where: examId
      ? { id: examId }
      : {
          status: {
            in: ["PUBLISHED", "CLOSED"]
          }
        },
    include: {
      discipline: true,
      classGroup: true,
      publicLinks: true,
      attempts: {
        include: {
          profile: true
        },
        orderBy: { startedAt: "desc" }
      }
    },
    orderBy: { startAt: "desc" }
  });

  const activeExamRows = exams.map((exam) => {
    const maxMinutes = exam.timeLimitMinutes ?? null;
    const inProgressAttempts = exam.attempts.filter((attempt) => attempt.status === "STARTED" || attempt.status === "IN_PROGRESS");
    const finishedAttempts = exam.attempts.filter((attempt) => attempt.status === "SUBMITTED");

    const averageElapsedMinutes =
      inProgressAttempts.length > 0
        ? Math.round(
            inProgressAttempts.reduce((sum, attempt) => {
              const raw = minutesBetween(attempt.startedAt, now);
              const capped = maxMinutes != null ? Math.min(raw, maxMinutes) : raw;
              return sum + capped;
            }, 0) / inProgressAttempts.length
          )
        : 0;

    return {
      id: exam.id,
      title: exam.title,
      publicCode: exam.publicCode,
      disciplineName: exam.discipline.name,
      classGroupName: exam.classGroup?.name ?? "Todas",
      statusLabel: getExamDisplayStatus(exam.status, exam.publicLinks[0]?.isActive ?? false),
      inProgressCount: inProgressAttempts.length,
      finishedCount: finishedAttempts.length,
      averageElapsedMinutes,
      attempts: exam.attempts.map((attempt) => {
        const rawMinutes =
          attempt.status === "SUBMITTED"
            ? Math.round((attempt.durationSeconds || 0) / 60)
            : minutesBetween(attempt.startedAt, now);
        const elapsedMinutes = maxMinutes != null ? Math.min(rawMinutes, maxMinutes) : rawMinutes;

        return {
          id: attempt.id,
          studentName: attempt.profile?.studentName || "Aluno sem identificação",
          classGroupName: attempt.profile?.classGroupName || "Sem turma",
          status: attempt.status,
          startedAt: attempt.startedAt.toISOString(),
          elapsedMinutes
        };
      })
    };
  });

  return {
    updatedAt: now.toISOString(),
    summary: {
      activeExams: activeExamRows.filter((exam) => exam.inProgressCount > 0).length,
      totalInProgress: activeExamRows.reduce((sum, exam) => sum + exam.inProgressCount, 0),
      totalFinished: activeExamRows.reduce((sum, exam) => sum + exam.finishedCount, 0),
      averageElapsedMinutes:
        activeExamRows.length > 0
          ? Math.round(activeExamRows.reduce((sum, exam) => sum + exam.averageElapsedMinutes, 0) / activeExamRows.length)
          : 0
    },
    exams: activeExamRows
  };
}
