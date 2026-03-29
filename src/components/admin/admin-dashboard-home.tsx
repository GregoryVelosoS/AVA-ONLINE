"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminDashboardHome({
  totals,
  latestExam,
  scoreDistribution
}: {
  totals: {
    totalExams: number;
    activeExams: number;
    recentStudents: number;
    avgScore: number;
  };
  latestExam: {
    id: string;
    title: string;
    publicCode: string;
    criticalQuestion: string;
    averageScorePercent: number;
  } | null;
  scoreDistribution: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <QuickCard label="Total de provas" value={String(totals.totalExams)} />
        <QuickCard label="Provas ativas" value={String(totals.activeExams)} />
        <QuickCard label="Respondentes recentes" value={String(totals.recentStudents)} />
        <QuickCard label="Média recente" value={`${totals.avgScore.toFixed(1)}%`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Última prova aplicada</p>
          {latestExam ? (
            <>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{latestExam.title}</h2>
              <p className="mt-2 text-sm text-slate-600">Código {latestExam.publicCode} · média {latestExam.averageScorePercent}%</p>
              <p className="mt-3 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm text-slate-700">
                Questão mais crítica: <strong>{latestExam.criticalQuestion}</strong>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="btn-primary" href={`/admin/reports?examId=${latestExam.id}`}>
                  Abrir relatório
                </Link>
                <Link className="btn-secondary" href={`/admin/monitoring?examId=${latestExam.id}`}>
                  Monitorar aplicação
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Ainda não há prova concluída com dados suficientes para destaque.</p>
          )}
        </div>

        <div className="surface-panel p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Distribuição recente</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Faixas de nota</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Bar dataKey="value" fill="#c1121f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/exams">
          Gerenciar provas
        </Link>
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/exams">
          Criar prova
        </Link>
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/monitoring">
          Monitoramento
        </Link>
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/reports">
          Relatórios
        </Link>
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/class-groups">
          Turmas
        </Link>
        <Link className="surface-panel p-5 text-center font-semibold text-slate-900 hover:border-red-200 hover:bg-red-50/40" href="/admin/disciplines">
          Disciplinas
        </Link>
      </section>
    </div>
  );
}

function QuickCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-panel p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}
