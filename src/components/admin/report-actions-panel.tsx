"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";

type ShareLink = {
  id: string;
  token: string;
  isActive: boolean;
  createdAt: string;
};

export function ReportActionsPanel({
  examId,
  examTitle,
  shareLinks
}: {
  examId: string;
  examTitle: string;
  shareLinks: ShareLink[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function createShareLink() {
    setMessage(null);
    const response = await fetch("/api/admin/reports/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        label: `Visualização de ${examTitle}`
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível gerar o link de visualização.");
      return;
    }

    setMessage("Link de visualização gerado com sucesso.");
    startTransition(() => router.refresh());
  }

  async function toggleShareLink(id: string, isActive: boolean) {
    setMessage(null);
    const response = await fetch("/api/admin/reports/share", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        isActive
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível atualizar o link.");
      return;
    }

    setMessage("Link de visualização atualizado.");
    startTransition(() => router.refresh());
  }

  return (
    <section className="surface-panel space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Compartilhamento e exportação</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Resultados externos da prova</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={`/api/admin/reports/export?examId=${examId}`}>
            Exportar PDF
          </a>
          <button className="btn-primary" disabled={isPending} onClick={createShareLink} type="button">
            Gerar link visualizador
          </button>
        </div>
      </div>

      {message ? <StatusBanner message={message} tone={message.includes("sucesso") ? "success" : "error"} /> : null}

      <div className="space-y-3">
        {shareLinks.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum link de visualização criado para esta prova.</p>
        ) : (
          shareLinks.map((shareLink) => {
            const viewerUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/viewer/reports/${shareLink.token}`;

            return (
              <div key={shareLink.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 break-all">{viewerUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(viewerUrl)} type="button">
                    Copiar link
                  </button>
                  <button className="btn-secondary" onClick={() => toggleShareLink(shareLink.id, !shareLink.isActive)} type="button">
                    {shareLink.isActive ? "Desativar link" : "Reativar link"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
