import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { RealtimeMonitoringDashboard } from "@/components/admin/realtime-monitoring-dashboard";
import { getRealtimeMonitoring } from "@/server/services/monitoring";

type PageProps = {
  searchParams: Promise<{ examId?: string }>;
};

export default async function MonitoringPage({ searchParams }: PageProps) {
  await getAdminOrRedirect();
  const filters = await searchParams;

  const [monitoring, exams] = await Promise.all([
    getRealtimeMonitoring(filters.examId),
    prisma.exam.findMany({
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Monitoramento em Tempo Real</h1>
          <p className="section-subtitle">Acompanhe a execução atual das provas, quem está em andamento e quem já concluiu.</p>
        </div>
        <AdminNav current="/admin/monitoring" />
      </header>

      <section className="surface-panel space-y-4 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Filtro operacional</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Escolha uma prova específica ou veja todas</h2>
        </div>

        <form className="grid gap-4 md:grid-cols-[1fr_auto_auto]" method="GET">
          <select className="input-base" defaultValue={filters.examId || ""} name="examId">
            <option value="">Todas as provas</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} · {exam.publicCode}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="submit">
            Atualizar visão
          </button>
          <a className="btn-secondary" href="/admin/monitoring">
            Limpar
          </a>
        </form>
      </section>

      <RealtimeMonitoringDashboard examId={filters.examId} initialData={monitoring} />
    </main>
  );
}
