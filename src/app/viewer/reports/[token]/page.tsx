import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { getExamAnalytics } from "@/server/services/analytics";
import { ExamAnalyticsDashboard } from "@/components/admin/exam-analytics-dashboard";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ViewerReportPage({ params }: PageProps) {
  const { token } = await params;

  const share = await prisma.reportShareLink.findUnique({
    where: { token }
  });

  if (!share || !share.isActive) {
    notFound();
  }

  const analytics = await getExamAnalytics({ examId: share.examId });

  return (
    <main className="container-page space-y-6 py-8">
      <header className="surface-dark p-6 md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">Visualização compartilhada</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">{analytics.selectedExam?.title || "Relatório da prova"}</h1>
        <p className="mt-3 max-w-3xl text-white/75">
          Esta é uma visão somente leitura dos resultados consolidados da avaliação, compartilhada pelo administrador.
        </p>
      </header>

      <ExamAnalyticsDashboard analytics={analytics} />
    </main>
  );
}
