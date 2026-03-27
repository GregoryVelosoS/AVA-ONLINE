import Link from "next/link";
import { getAdminOrRedirect } from "@/lib/admin-session";
import { getDashboardOverview } from "@/server/services/analytics";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function AdminDashboardPage() {
  await getAdminOrRedirect();
  const data = await getDashboardOverview();

  return (
    <main className="container-page space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <nav className="flex gap-2 text-sm">
          <Link href="/admin/questions" className="rounded border px-3 py-1">Questões</Link>
          <Link href="/admin/exams" className="rounded border px-3 py-1">Provas</Link>
          <Link href="/admin/monitoring" className="rounded border px-3 py-1">Monitoramento</Link>
          <Link href="/admin/reports" className="rounded border px-3 py-1">Relatórios</Link>
        </nav>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Total de provas" value={String(data.totalExams)} />
        <MetricCard label="Alunos respondentes" value={String(data.totalStudents)} />
        <MetricCard label="Taxa de conclusão" value={`${data.completionRate.toFixed(1)}%`} />
        <MetricCard label="Média geral" value={data.avgScore.toFixed(2)} />
        <MetricCard label="Tempo médio" value={`${Math.round(data.avgDurationSeconds / 60)} min`} />
      </section>
    </main>
  );
}
