"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { StatusBanner } from "@/components/ui/status-banner";

type BackupItem = {
  counts: Record<string, number>;
  createdAt: string;
  reason: string;
  relativePath: string;
};

const confirmationPhrase = "RESETAR BANCO";

export function SystemMaintenancePanel({ backups }: { backups: BackupItem[] }) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function generateBackup() {
    setError(null);
    setSuccess(null);
    setIsBackingUp(true);

    try {
      const response = await fetch("/api/admin/system/backup", {
        method: "POST"
      });

      const payload = (await response.json()) as { error?: string; relativePath?: string };
      if (!response.ok) {
        setError(payload.error || "Não foi possível gerar o backup manual.");
        return;
      }

      setSuccess(`Backup manual criado em ${payload.relativePath}.`);
      startRefreshTransition(() => router.refresh());
    } finally {
      setIsBackingUp(false);
    }
  }

  async function resetDatabase() {
    setError(null);
    setSuccess(null);
    setIsResetting(true);

    try {
      const response = await fetch("/api/admin/system/reset", {
        body: JSON.stringify({ confirmationText }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const payload = (await response.json()) as {
        backup?: { relativePath?: string };
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.error || "Não foi possível resetar a base.");
        return;
      }

      setConfirmationText("");
      setSuccess(`${payload.message} Backup criado em ${payload.backup?.relativePath}.`);
      startRefreshTransition(() => router.refresh());
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel relative space-y-5 p-5 md:p-6">
        <LoadingOverlay active={isBackingUp || isResetting} label={isResetting ? "Gerando backup e resetando base..." : "Gerando backup..."} />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Operações críticas</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Backup e reset seguro da base</h2>
          <p className="mt-2 text-sm text-slate-600">
            Todo reset administrativo gera automaticamente um snapshot JSON completo antes da limpeza. Os arquivos ficam organizados em
            `backups/db/ano/mês`, e os usuários administrativos são preservados para manter o acesso operacional.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <LoadingButton loading={isBackingUp || isRefreshing} loadingText="Gerando backup..." onClick={generateBackup} type="button" variant="secondary">
            Gerar backup manual
          </LoadingButton>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
          <p className="text-sm font-semibold text-red-800">Reset administrativo com proteção obrigatória</p>
          <p className="mt-2 text-sm text-slate-700">
            Antes do reset, o sistema cria um backup com data/hora, depois remove os dados operacionais da base atual e preserva os
            usuários administrativos. Para confirmar, digite exatamente <strong>{confirmationPhrase}</strong>.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,280px)_auto]">
            <input
              className="input-base"
              placeholder={confirmationPhrase}
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
            />
            <LoadingButton
              disabled={confirmationText !== confirmationPhrase}
              loading={isResetting || isRefreshing}
              loadingText="Resetando..."
              onClick={resetDatabase}
              type="button"
              variant="danger"
            >
              Criar backup e resetar banco
            </LoadingButton>
          </div>
        </div>

        {error ? <StatusBanner message={error} tone="error" /> : null}
        {success ? <StatusBanner message={success} tone="success" /> : null}
      </section>

      <section className="surface-panel p-5 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Backups recentes</h2>
          <p className="text-sm text-slate-500">Histórico local disponível para futura restauração manual ou automatizada.</p>
        </div>

        {backups.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum backup encontrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={`${backup.relativePath}-${backup.createdAt}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{backup.relativePath}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(backup.createdAt).toLocaleString("pt-BR")} · motivo {backup.reason}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                  questões {backup.counts.questions || 0} · provas {backup.counts.exams || 0} · tentativas {backup.counts.studentAttempts || 0} · usuários {backup.counts.adminUsers || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
