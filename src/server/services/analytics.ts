import { prisma } from "@/server/db/prisma";

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
  const scores = attempts.map((a) => Number(a.finalScore));
  const avgScore = scores.length ? scores.reduce((acc, s) => acc + s, 0) / scores.length : 0;

  const avgDurationSeconds =
    attempts.length > 0
      ? attempts.reduce((acc, a) => acc + (a.durationSeconds || 0), 0) / attempts.length
      : 0;

  return {
    totalExams,
    totalStudents,
    completionRate,
    avgScore,
    avgDurationSeconds
  };
}
