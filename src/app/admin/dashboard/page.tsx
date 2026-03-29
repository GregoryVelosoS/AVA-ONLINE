import { getAdminOrRedirect } from "@/lib/admin-session";
import { getDashboardOverview, getExamAnalytics } from "@/server/services/analytics";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminDashboardHome } from "@/components/admin/admin-dashboard-home";

export default async function AdminDashboardPage() {
  await getAdminOrRedirect();

  const [overview, latestExam, activeExams] = await Promise.all([
    getDashboardOverview(),
    prisma.exam.findFirst({
      where: {
        attempts: {
          some: {
            status: "SUBMITTED"
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.exam.count({
      where: {
        status: "PUBLISHED",
        publicLinks: {
          some: {
            isActive: true
          }
        }
      }
    })
  ]);

  const latestAnalytics = latestExam ? await getExamAnalytics({ examId: latestExam.id }) : null;

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="section-title">Dashboard Administrativo</h1>
            <p className="section-subtitle">Resumo da operação atual, última prova aplicada e atalhos rápidos para gestão.</p>
          </div>
        </div>
        <AdminNav current="/admin/dashboard" role="ADM" />
      </header>

      <AdminDashboardHome
        totals={{
          totalExams: overview.totalExams,
          activeExams,
          recentStudents: overview.totalStudents,
          avgScore: latestAnalytics?.summary?.averageScorePercent || overview.avgScore
        }}
        latestExam={
          latestAnalytics?.selectedExam && latestAnalytics.questionHighlights
            ? {
                id: latestAnalytics.selectedExam.id,
                title: latestAnalytics.selectedExam.title,
                publicCode: latestAnalytics.selectedExam.publicCode,
                criticalQuestion: latestAnalytics.questionHighlights.criticalQuestion?.code || "Sem dados",
                averageScorePercent: latestAnalytics.summary?.averageScorePercent || 0
              }
            : null
        }
        scoreDistribution={latestAnalytics?.scoreDistribution || []}
      />
    </main>
  );
}
