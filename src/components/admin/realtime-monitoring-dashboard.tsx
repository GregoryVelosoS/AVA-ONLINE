"use client";

import { useEffect, useState } from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { StatusBanner } from "@/components/ui/status-banner";

type MonitoringData = {
  updatedAt: string;
  summary: {
    activeExams: number;
    totalInProgress: number;
    totalFinished: number;
    averageElapsedMinutes: number;
  };
  exams: Array<{
    id: string;
    title: string;
    publicCode: string;
    disciplineName: string;
    classGroupName: string;
    statusLabel: string;
    inProgressCount: number;
    finishedCount: number;
    averageElapsedMinutes: number;
    attempts: Array<{
      id: string;
      studentName: string;
      classGroupName: string;
      status: string;
      startedAt: string;
      elapsedMinutes: number;
    }>;
  }>;
};

export function RealtimeMonitoringDashboard({
  initialData,
  examId
}: {
  initialData: MonitoringData;
  examId?: string;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const params = new URLSearchParams();
      if (examId) {
        params.set("examId", examId);
      }

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/monitoring${params.toString() ? `?${params.toString()}` : ""}`, {
        cache: "no-store"
      });

      if (response.ok) {
        const payload = (await response.json()) as MonitoringData;
        setData(payload);
      } else {
        setError("Não foi possível atualizar o monitoramento em tempo real.");
      }

      setLoading(false);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [examId]);

  return (
    <div className="space-y-6">
      {loading ? <StatusBanner message="Atualizando monitoramento em tempo real..." tone="info" /> : null}
      {error ? <StatusBanner message={error} tone="error" /> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="surface-panel p-5">
          <p className="text-sm text-slate-500">Provas com execução ativa</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.summary.activeExams}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-slate-500">Alunos em andamento</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.summary.totalInProgress}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-slate-500">Alunos concluídos</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.summary.totalFinished}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-slate-500">Tempo médio decorrido</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.summary.averageElapsedMinutes} min</p>
        </div>
      </section>

      <section className="surface-panel p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Atualização automática</p>
        <p className="mt-2 text-sm text-slate-600">Última atualização em {new Date(data.updatedAt).toLocaleString("pt-BR")}.</p>
      </section>

      <div className="space-y-4">
        {data.exams.map((exam) => (
          <section key={exam.id} className="surface-panel relative space-y-4 p-5">
            <LoadingOverlay active={loading} label="Atualizando dashboard..." />

            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Código {exam.publicCode}</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{exam.title}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {exam.disciplineName} · {exam.classGroupName} · {exam.statusLabel}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Em andamento: {exam.inProgressCount}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Finalizados: {exam.finishedCount}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Tempo médio: {exam.averageElapsedMinutes} min
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-left text-white">
                  <tr>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Início</th>
                    <th className="px-4 py-3">Tempo decorrido</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-950">{attempt.studentName}</td>
                      <td className="px-4 py-3">{attempt.classGroupName}</td>
                      <td className="px-4 py-3">{attempt.status}</td>
                      <td className="px-4 py-3">{new Date(attempt.startedAt).toLocaleTimeString("pt-BR")}</td>
                      <td className="px-4 py-3">{attempt.elapsedMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
