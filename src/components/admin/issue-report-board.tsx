"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getIssueReportScreenshotUrl } from "@/lib/assets";
import { StatusBanner } from "@/components/ui/status-banner";

type IssueItem = {
  id: string;
  type: "SUGGESTION" | "BUG" | "QUESTION";
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "ARCHIVED";
  title: string;
  description: string;
  sourcePath: string;
  contextLabel: string | null;
  screenshotPath: string | null;
  screenshotName: string | null;
  createdAt: string;
  internalNotes: string | null;
};

export function IssueReportBoard({ reports }: { reports: IssueItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function updateReport(id: string, status: IssueItem["status"], internalNotes: string) {
    setMessage(null);
    const response = await fetch(`/api/issue-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, internalNotes })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível atualizar o registro.");
      return;
    }

    setMessage("Registro atualizado com sucesso.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {message ? <StatusBanner message={message} tone={message.includes("sucesso") ? "success" : "error"} /> : null}

      {reports.map((report) => (
        <IssueReportCard key={report.id} isPending={isPending} report={report} onSave={updateReport} />
      ))}
    </div>
  );
}

function IssueReportCard({
  report,
  onSave,
  isPending
}: {
  report: IssueItem;
  onSave: (id: string, status: IssueItem["status"], notes: string) => Promise<void>;
  isPending: boolean;
}) {
  const [status, setStatus] = useState<IssueItem["status"]>(report.status);
  const [notes, setNotes] = useState(report.internalNotes || "");
  const screenshotUrl = getIssueReportScreenshotUrl(report.screenshotPath);

  return (
    <section className="surface-panel space-y-4 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{report.type}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{report.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{report.description}</p>
          <p className="mt-3 text-xs text-slate-500">
            {report.contextLabel || "Contexto geral"} · {report.sourcePath} · {new Date(report.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
          {report.status}
        </span>
      </div>

      {screenshotUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <Image alt={report.screenshotName || "Anexo do registro"} className="h-auto w-full object-cover" height={320} src={screenshotUrl} unoptimized width={640} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[240px_1fr_auto] md:items-end">
        <div>
          <label className="field-label">Status</label>
          <select className="input-base" value={status} onChange={(event) => setStatus(event.target.value as IssueItem["status"])}>
            <option value="NEW">Novo</option>
            <option value="IN_REVIEW">Em análise</option>
            <option value="RESOLVED">Resolvido</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </div>
        <div>
          <label className="field-label">Observação interna</label>
          <textarea className="input-base min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <button className="btn-primary" disabled={isPending} onClick={() => onSave(report.id, status, notes)} type="button">
          Salvar
        </button>
      </div>
    </section>
  );
}
