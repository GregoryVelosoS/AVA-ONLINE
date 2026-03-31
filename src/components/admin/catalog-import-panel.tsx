"use client";

import { FormEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  buildCatalogImportPreview,
  catalogImportInstructions,
  catalogImportLabels,
  catalogImportTemplates,
  type CatalogImportDisciplineLookup,
  type CatalogImportEntity,
  type CatalogImportItemMap,
  type CatalogImportPreviewError
} from "@/lib/catalog-import";
import { LoadingButton } from "@/components/ui/loading-button";
import { StatusBanner } from "@/components/ui/status-banner";

type CatalogImportPanelProps<TItem extends CatalogImportEntity> = {
  disciplines?: CatalogImportDisciplineLookup[];
  entity: TItem;
  onImported?: () => void;
};

function describePreviewItem(entity: CatalogImportEntity, item: CatalogImportItemMap[CatalogImportEntity]) {
  if (entity === "disciplines") {
    const discipline = item as CatalogImportItemMap["disciplines"];
    return `${discipline.code} · ${discipline.name}`;
  }

  if (entity === "themes") {
    const theme = item as CatalogImportItemMap["themes"];
    return `${theme.code} · ${theme.name}${theme.description ? ` · ${theme.description}` : ""}`;
  }

  const classGroup = item as CatalogImportItemMap["class-groups"];
  return `${classGroup.code} · ${classGroup.name}${classGroup.disciplineName ? ` · ${classGroup.disciplineName}` : ""}`;
}

export function CatalogImportPanel<TItem extends CatalogImportEntity>({
  disciplines = [],
  entity,
  onImported
}: CatalogImportPanelProps<TItem>) {
  const labels = catalogImportLabels[entity];
  const [mode, setMode] = useState<"json" | "excel">("json");
  const [content, setContent] = useState(JSON.stringify(catalogImportTemplates[entity], null, 2));
  const [previewItems, setPreviewItems] = useState<CatalogImportItemMap[TItem][]>([]);
  const [previewErrors, setPreviewErrors] = useState<CatalogImportPreviewError[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewSummary = useMemo(
    () => `${previewItems.length} ${labels.plural} pronta(s) para importação.`,
    [labels.plural, previewItems.length]
  );

  function applyPreview(rows: Record<string, unknown>[]) {
    const preview = buildCatalogImportPreview(entity, rows, disciplines);
    setPreviewItems(preview.items as CatalogImportItemMap[TItem][]);
    setPreviewErrors(preview.errors);

    if (preview.items.length > 0) {
      setSuccess(`${preview.items.length} ${labels.plural} pronta(s) para importação.`);
    } else {
      setSuccess(null);
    }

    if (preview.errors.length > 0) {
      setError(`Foram encontrados ${preview.errors.length} erro(s) na pré-visualização.`);
      return;
    }

    setError(null);
  }

  function previewJson() {
    setError(null);
    setSuccess(null);
    setIsPreviewing(true);

    try {
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) {
        setError(`O JSON precisa ser um array de ${labels.plural}.`);
        setPreviewItems([]);
        setPreviewErrors([]);
        return;
      }

      applyPreview(parsed as Record<string, unknown>[]);
    } catch {
      setError("O conteúdo JSON é inválido.");
      setPreviewItems([]);
      setPreviewErrors([]);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function previewExcel(file: File | undefined) {
    setError(null);
    setSuccess(null);

    if (!file) {
      return;
    }

    setIsPreviewing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

      setFileName(file.name);
      applyPreview(rows);
    } catch {
      setError("Não foi possível ler o arquivo Excel informado.");
      setPreviewItems([]);
      setPreviewErrors([]);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (previewItems.length === 0) {
      setError(`Gere uma pré-visualização válida antes de importar ${labels.plural}.`);
      return;
    }

    if (previewErrors.length > 0) {
      setError("Corrija os erros da pré-visualização antes de confirmar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/catalog/import", {
        body: JSON.stringify({
          entity,
          items: previewItems
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const payload = (await response.json()) as {
        count?: number;
        error?: string;
        itemErrors?: CatalogImportPreviewError[];
      };

      if (!response.ok) {
        setPreviewErrors(payload.itemErrors || []);
        setError(payload.error || `Não foi possível importar ${labels.plural}.`);
        return;
      }

      setSuccess(`${payload.count ?? 0} ${labels.plural} importada(s) com sucesso.`);
      setPreviewItems([]);
      setPreviewErrors([]);
      setFileName("");
      onImported?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2">
        <LoadingButton
          className="min-w-[136px]"
          loading={false}
          onClick={() => setMode("json")}
          type="button"
          variant={mode === "json" ? "primary" : "secondary"}
        >
          Importar JSON
        </LoadingButton>
        <LoadingButton
          className="min-w-[136px]"
          loading={false}
          onClick={() => setMode("excel")}
          type="button"
          variant={mode === "excel" ? "primary" : "secondary"}
        >
          Importar Excel
        </LoadingButton>
        <a className="btn-secondary" href={`/api/admin/catalog/import-template?entity=${entity}&format=json`}>
          Baixar modelo JSON
        </a>
        <a className="btn-secondary" href={`/api/admin/catalog/import-template?entity=${entity}&format=xlsx`}>
          Baixar modelo Excel
        </a>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Instruções de preenchimento</p>
        <div className="mt-2 space-y-1.5">
          {catalogImportInstructions[entity].map((instruction) => (
            <p key={instruction}>• {instruction}</p>
          ))}
        </div>
      </div>

      {mode === "json" ? (
        <div className="space-y-3">
          <label className="field-label">Conteúdo JSON</label>
          <textarea
            className="input-base min-h-64 font-mono text-xs"
            spellCheck={false}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <LoadingButton loading={isPreviewing} loadingText="Validando..." type="button" variant="secondary" onClick={previewJson}>
            Gerar pré-visualização
          </LoadingButton>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="field-label">Arquivo Excel (.xlsx)</label>
          <label className="surface-panel block cursor-pointer p-5 text-center">
            <span className="btn-secondary">Selecionar arquivo Excel</span>
            <input className="hidden" accept=".xlsx,.xls,.csv" onChange={(event) => previewExcel(event.target.files?.[0])} type="file" />
            <p className="mt-3 text-sm text-slate-500">{fileName || "Nenhum arquivo selecionado."}</p>
          </label>
          {isPreviewing ? <StatusBanner message="Validando arquivo e preparando pré-visualização..." tone="info" /> : null}
        </div>
      )}

      {error ? <StatusBanner message={error} tone="error" /> : null}
      {success ? <StatusBanner message={success} tone="success" /> : null}

      {previewErrors.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
          <p className="text-sm font-semibold text-red-800">Erros encontrados por linha/item</p>
          <div className="mt-3 space-y-2 text-sm text-red-700">
            {previewErrors.slice(0, 12).map((previewError) => (
              <p key={`${previewError.index}-${previewError.message}`}>
                Linha {previewError.index + 2}: {previewError.message}
              </p>
            ))}
            {previewErrors.length > 12 ? <p>Mostrando 12 de {previewErrors.length} erros.</p> : null}
          </div>
        </div>
      ) : null}

      {previewItems.length > 0 ? (
        <div className="surface-panel p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Pré-visualização</h3>
              <p className="text-sm text-slate-500">{previewSummary}</p>
            </div>
            <LoadingButton loading={isSubmitting} loadingText="Importando..." type="submit">
              Confirmar importação
            </LoadingButton>
          </div>

          <div className="space-y-3">
            {previewItems.slice(0, 6).map((item, index) => (
              <div key={`${entity}-${index}-${describePreviewItem(entity, item as CatalogImportItemMap[CatalogImportEntity])}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  {index + 1}. {describePreviewItem(entity, item as CatalogImportItemMap[CatalogImportEntity])}
                </p>
              </div>
            ))}
            {previewItems.length > 6 ? <p className="text-sm text-slate-500">Mostrando 6 itens de {previewItems.length}.</p> : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
