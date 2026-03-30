"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";

type ShareLink = {
  id: string;
  token: string;
  isActive: boolean;
  createdAt: string;
};

function safeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function buildReportPdf(examTitle: string, examCode?: string) {
  const root = document.getElementById("report-export-root");
  if (!root) {
    throw new Error("A area do relatorio nao foi encontrada para exportacao.");
  }

  if ("fonts" in document) {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  }
  await new Promise((resolve) => window.setTimeout(resolve, 250));

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    scrollX: 0,
    scrollY: -window.scrollY
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;
  const pixelsPerMm = canvas.width / printableWidth;
  const sliceHeightPx = Math.max(1, Math.floor(printableHeight * pixelsPerMm));

  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < canvas.height) {
    const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - renderedHeight);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = currentSliceHeight;

    const context = pageCanvas.getContext("2d");
    if (!context) {
      throw new Error("Nao foi possivel preparar a exportacao do PDF.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      currentSliceHeight,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    const sliceData = pageCanvas.toDataURL("image/png");
    const renderedHeightMm = currentSliceHeight / pixelsPerMm;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    pdf.addImage(sliceData, "PNG", margin, margin, printableWidth, renderedHeightMm, undefined, "FAST");
    renderedHeight += currentSliceHeight;
    pageIndex += 1;
  }

  pdf.save(`relatorio-${safeFilenamePart(examCode || examTitle)}.pdf`);
}

export function ReportActionsPanel({
  examId,
  examTitle,
  examCode,
  shareLinks
}: {
  examId: string;
  examTitle: string;
  examCode?: string;
  shareLinks: ShareLink[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  async function createShareLink() {
    setMessage(null);
    const response = await fetch("/api/admin/reports/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        label: `Visualizacao de ${examTitle}`
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel gerar o link de visualizacao.");
      return;
    }

    setMessage("Link de visualizacao gerado com sucesso.");
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
      setMessage(payload.error || "Nao foi possivel atualizar o link.");
      return;
    }

    setMessage("Link de visualizacao atualizado.");
    startTransition(() => router.refresh());
  }

  async function exportPdf() {
    setMessage(null);
    setIsExporting(true);

    try {
      await buildReportPdf(examTitle, examCode);
    } catch (error) {
      const fallback = "Nao foi possivel exportar o PDF do relatorio.";
      setMessage(error instanceof Error ? error.message || fallback : fallback);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="surface-panel space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Compartilhamento e exportacao</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Resultados externos da prova</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" disabled={isExporting} onClick={exportPdf} type="button">
            {isExporting ? "Preparando PDF..." : "Exportar PDF"}
          </button>
          <button className="btn-primary" disabled={isPending} onClick={createShareLink} type="button">
            Gerar link visualizador
          </button>
        </div>
      </div>

      {message ? <StatusBanner message={message} tone={message.includes("sucesso") ? "success" : "error"} /> : null}

      <div className="space-y-3">
        {shareLinks.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum link de visualizacao criado para esta prova.</p>
        ) : (
          shareLinks.map((shareLink) => {
            const viewerUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/viewer/reports/${shareLink.token}`;

            return (
              <div key={shareLink.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="break-all text-sm font-semibold text-slate-900">{viewerUrl}</p>
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
