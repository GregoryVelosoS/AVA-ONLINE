"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { StatusBanner } from "@/components/ui/status-banner";
import { getExamDisplayStatus, type ExamStatusValue } from "@/lib/exam-status";

type ExamItem = {
  id: string;
  title: string;
  publicCode: string;
  disciplineName: string;
  classGroupName: string;
  timeLimitMinutes: number | null;
  themeCount: number;
  status: ExamStatusValue;
  isPublicActive: boolean;
};

export function ExamManagementList({ exams }: { exams: ExamItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"activate" | "archive" | "deactivate" | "close" | "delete" | null>(null);
  const [actionLabel, setActionLabel] = useState("Atualizando prova...");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isFiltering, startFilterTransition] = useTransition();

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const displayStatus = getExamDisplayStatus(exam.status, exam.isPublicActive);
      const normalizedQuery = query.toLowerCase();
      const matchesQuery =
        !query ||
        exam.title.toLowerCase().includes(normalizedQuery) ||
        exam.publicCode.toLowerCase().includes(normalizedQuery) ||
        exam.disciplineName.toLowerCase().includes(normalizedQuery) ||
        exam.classGroupName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "ALL" || displayStatus === status;

      return matchesQuery && matchesStatus;
    });
  }, [exams, query, status]);

  async function runLifecycle(id: string, action: "activate" | "deactivate" | "close" | "archive") {
    setMessage(null);
    setActionId(id);
    setActionType(action);
    setActionLabel("Atualizando status da prova...");

    try {
      const response = await fetch(`/api/admin/exams/${id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error || "Não foi possível atualizar o status da prova.");
        return;
      }

      setMessage("Status da prova atualizado com sucesso.");
      startRefreshTransition(() => router.refresh());
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  async function deleteExam(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir esta prova?");
    if (!confirmed) {
      return;
    }

    setMessage(null);
    setActionId(id);
    setActionType("delete");
    setActionLabel("Excluindo prova...");

    try {
      const response = await fetch(`/api/admin/exams/${id}`, {
        method: "DELETE"
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error || "Não foi possível excluir a prova.");
        return;
      }

      setMessage("Prova excluída com sucesso.");
      startRefreshTransition(() => router.refresh());
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          className="input-base"
          placeholder="Buscar por nome, código, turma ou disciplina"
          value={query}
          onChange={(event) => startFilterTransition(() => setQuery(event.target.value))}
        />
        <select className="input-base" value={status} onChange={(event) => startFilterTransition(() => setStatus(event.target.value))}>
          <option value="ALL">Todos os status</option>
          <option value="Ativa">Ativas</option>
          <option value="Desativada">Desativadas</option>
          <option value="Rascunho">Rascunhos</option>
          <option value="Encerrada">Encerradas</option>
          <option value="Arquivada">Arquivadas</option>
        </select>
      </div>

      {message ? <StatusBanner message={message} tone={message.includes("sucesso") ? "success" : "error"} /> : null}
      {isFiltering ? <StatusBanner message="Aplicando filtros..." tone="info" /> : null}

      <div className="space-y-3">
        {filteredExams.map((exam) => {
          const displayStatus = getExamDisplayStatus(exam.status, exam.isPublicActive);
          const rowBusy = actionId === exam.id;

          return (
            <div key={exam.id} className="relative rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <LoadingOverlay active={rowBusy || isRefreshing} label={rowBusy ? actionLabel : "Atualizando listagem..."} />

              <div className="mb-3 h-1 rounded-full bg-[linear-gradient(90deg,#c1121f_0%,#101010_100%)]" />
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <p className="text-xl font-black tracking-tight text-slate-950">{exam.title}</p>
                  <p className="text-sm text-slate-600">
                    Código {exam.publicCode} · {exam.disciplineName} · {exam.classGroupName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {exam.timeLimitMinutes ? `${exam.timeLimitMinutes} min` : "Sem limite"} · {exam.themeCount} tema(s) vinculado(s)
                  </p>
                  <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                    {displayStatus}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={`/admin/exams/${exam.id}`}>
                    Editar
                  </Link>
                  <Link className="btn-secondary" href={`/admin/monitoring?examId=${exam.id}`}>
                    Monitoramento
                  </Link>
                  <Link className="btn-secondary" href={`/admin/reports?examId=${exam.id}`}>
                    Relatórios
                  </Link>
                  {exam.isPublicActive ? (
                    <LoadingButton
                      disabled={rowBusy && actionType !== "deactivate"}
                      loading={rowBusy && actionType === "deactivate"}
                      loadingText="Desativando..."
                      onClick={() => runLifecycle(exam.id, "deactivate")}
                      type="button"
                      variant="secondary"
                    >
                      Desativar
                    </LoadingButton>
                  ) : (
                    <LoadingButton
                      disabled={rowBusy && actionType !== "activate"}
                      loading={rowBusy && actionType === "activate"}
                      loadingText="Ativando..."
                      onClick={() => runLifecycle(exam.id, "activate")}
                      type="button"
                    >
                      Ativar
                    </LoadingButton>
                  )}
                  <LoadingButton
                    disabled={rowBusy && actionType !== "close"}
                    loading={rowBusy && actionType === "close"}
                    loadingText="Encerrando..."
                    onClick={() => runLifecycle(exam.id, "close")}
                    type="button"
                    variant="secondary"
                  >
                    Encerrar
                  </LoadingButton>
                  <LoadingButton
                    disabled={rowBusy && actionType !== "delete"}
                    loading={rowBusy && actionType === "delete"}
                    loadingText="Excluindo..."
                    onClick={() => deleteExam(exam.id)}
                    type="button"
                    variant="danger"
                  >
                    Excluir
                  </LoadingButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
