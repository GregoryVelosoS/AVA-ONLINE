"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { StatusBanner } from "@/components/ui/status-banner";

type Discipline = {
  id: string;
  name: string;
  code?: string;
};

type NormalizedQuestion = {
  code: string;
  title: string;
  type: "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
  subject: string;
  topic: string;
  statement: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  disciplineId: string;
  context: string;
  visualSupportType: "NONE" | "ASSET" | "CODE";
  supportCode: string;
  expectedFeedback: string;
  answerExplanation: string;
  studyTopics: string;
  studyLinks: string;
  referencePlaylist: string;
  complementaryNotes: string;
  supportImagePath: string;
  supportImageName: string;
  supportImageMime: string;
  supportFilePath: string;
  supportFileName: string;
  supportFileMime: string;
  defaultWeight: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  options: Array<{ label: string; content: string; isCorrect: boolean; position: number }>;
};

function readValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeVisualSupportType(rawValue: string) {
  const normalized = rawValue.trim().toUpperCase();

  if (["CODE", "CODIGO", "CÓDIGO"].includes(normalized)) {
    return "CODE" as const;
  }

  if (["ASSET", "IMAGE", "IMAGEM", "ARQUIVO", "FILE"].includes(normalized)) {
    return "ASSET" as const;
  }

  return "NONE" as const;
}

function resolveDisciplineId(rawValue: string, disciplines: Discipline[], fallbackDisciplineId: string) {
  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return fallbackDisciplineId;
  }

  const found = disciplines.find(
    (discipline) =>
      discipline.id.toLowerCase() === normalized ||
      discipline.name.toLowerCase() === normalized ||
      discipline.code?.toLowerCase() === normalized
  );

  return found?.id ?? fallbackDisciplineId;
}

function normalizeQuestionPayload(
  source: Record<string, unknown>,
  disciplines: Discipline[],
  fallbackDisciplineId: string
): NormalizedQuestion {
  const alternativeLetters = ["A", "B", "C", "D", "E"] as const;
  const correctAlternative = readValue(source, ["correctAlternative", "respostaCorreta", "alternativaCorreta"]).toUpperCase();
  const visualSupportType = normalizeVisualSupportType(
    readValue(source, ["visualSupportType", "tipoSuporteVisual", "supportType"])
  );

  const options = alternativeLetters
    .map((letter, index) => {
      const content = readValue(source, [`alternative${letter}`, `alternativa${letter}`]);
      if (!content) {
        return null;
      }

      return {
        label: letter,
        content,
        isCorrect: correctAlternative === letter,
        position: index + 1
      };
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  return {
    code: readValue(source, ["code", "codigo"]),
    title: readValue(source, ["title", "titulo"]),
    type: (readValue(source, ["type", "tipo"]).toUpperCase() as NormalizedQuestion["type"]) || "MULTIPLE_CHOICE",
    subject: readValue(source, ["subject", "assunto"]),
    topic: readValue(source, ["topic", "tag", "topico", "tópico"]),
    statement: readValue(source, ["statement", "commandQuestion", "comandoQuestao", "enunciado"]),
    difficulty: (readValue(source, ["difficulty", "nivel", "nível"]).toUpperCase() as NormalizedQuestion["difficulty"]) || "EASY",
    disciplineId: resolveDisciplineId(readValue(source, ["discipline", "disciplina", "disciplineId"]), disciplines, fallbackDisciplineId),
    context: readValue(source, ["context", "contexto"]),
    visualSupportType,
    supportCode: readValue(source, ["supportCode", "supportVisualCode", "suporteVisualCodigo"]),
    expectedFeedback: readValue(source, ["expectedFeedback", "feedbackEsperado"]),
    answerExplanation: readValue(source, ["answerExplanation", "explicacaoResposta", "explicaçãoResposta"]),
    studyTopics: readValue(source, ["studyTopics", "temasParaEstudo"]),
    studyLinks: readValue(source, ["studyLinks", "linksDeApoio"]),
    referencePlaylist: readValue(source, ["referencePlaylist", "playlistOuUrlReferencia", "playlist"]),
    complementaryNotes: readValue(source, ["complementaryNotes", "observacoesComplementares", "observaçõesComplementares"]),
    supportImagePath: readValue(source, ["supportImagePath", "supportVisualFile", "suporteVisualArquivo"]),
    supportImageName: "",
    supportImageMime: "",
    supportFilePath: readValue(source, ["supportFilePath", "supportFileReference", "arquivoApoio"]),
    supportFileName: "",
    supportFileMime: "",
    defaultWeight: Number(readValue(source, ["defaultWeight", "pesoPadrao", "pesoPadrão"]) || 1),
    status: (readValue(source, ["status", "situacao", "situação"]).toUpperCase() as NormalizedQuestion["status"]) || "ACTIVE",
    options
  };
}

const template = JSON.stringify(
  [
    {
      code: "Q-101",
      title: "Operadores aritméticos",
      type: "MULTIPLE_CHOICE",
      subject: "Algoritmos",
      topic: "Operadores",
      discipline: "Lógica de Programação",
      context: "Considere uma linguagem com operador mod para obter o resto da divisão.",
      visualSupportType: "CODE",
      supportCode: "const resto = 15 % 4;",
      statement: "Qual expressão retorna o resto da divisão de 15 por 4?",
      expectedFeedback: "Revise operadores aritméticos básicos e o conceito de resto da divisão.",
      answerExplanation: "O operador mod retorna o resto da divisão inteira.",
      studyTopics: "Operadores aritméticos\nMódulo (%)",
      studyLinks: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Remainder",
      referencePlaylist: "https://youtube.com/playlist?list=EXEMPLO",
      complementaryNotes: "Observe a diferença entre divisão comum e operador de módulo.",
      difficulty: "EASY",
      defaultWeight: 1,
      status: "ACTIVE",
      alternativeA: "15 / 4",
      alternativeB: "15 div 4",
      alternativeC: "15 mod 4",
      correctAlternative: "C"
    }
  ],
  null,
  2
);

function normalizeQuestions(
  rows: Record<string, unknown>[],
  disciplines: Discipline[],
  fallbackDisciplineId: string
) {
  return rows
    .map((row) => normalizeQuestionPayload(row, disciplines, fallbackDisciplineId))
    .filter((question) => question.code && question.statement && question.subject && question.disciplineId);
}

export function QuestionImportPanel({ disciplines }: { disciplines: Discipline[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"json" | "excel">("json");
  const [fallbackDisciplineId, setFallbackDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [content, setContent] = useState(template);
  const [previewQuestions, setPreviewQuestions] = useState<NormalizedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const previewCount = useMemo(() => previewQuestions.length, [previewQuestions]);

  function applyPreview(questions: NormalizedQuestion[]) {
    setPreviewQuestions(questions);
    setSuccess(`${questions.length} questão(ões) prontas para importação.`);
  }

  function previewJson() {
    setError(null);
    setSuccess(null);

    try {
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) {
        setError("O JSON precisa ser um array de questões.");
        return;
      }

      const normalized = normalizeQuestions(parsed as Record<string, unknown>[], disciplines, fallbackDisciplineId);
      if (normalized.length === 0) {
        setError("Nenhuma questão válida foi encontrada no JSON.");
        return;
      }

      applyPreview(normalized);
    } catch {
      setError("O conteúdo JSON é inválido.");
    }
  }

  async function previewExcel(file: File | undefined) {
    setError(null);
    setSuccess(null);

    if (!file) {
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    const normalized = normalizeQuestions(rows, disciplines, fallbackDisciplineId);

    if (normalized.length === 0) {
      setError("Nenhuma questão válida foi encontrada no arquivo Excel.");
      return;
    }

    setFileName(file.name);
    applyPreview(normalized);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (previewQuestions.length === 0) {
      setError("Gere uma pré-visualização antes de confirmar a importação.");
      return;
    }

    const response = await fetch("/api/admin/questions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: previewQuestions
      })
    });

    const payload = (await response.json()) as { error?: string; count?: number };

    if (!response.ok) {
      setError(payload.error || "Não foi possível importar as questões.");
      return;
    }

    setSuccess(`${payload.count ?? 0} questão(ões) importada(s) com sucesso.`);
    setPreviewQuestions([]);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2">
        <button className={mode === "json" ? "btn-primary" : "btn-secondary"} onClick={() => setMode("json")} type="button">
          Importar JSON
        </button>
        <button className={mode === "excel" ? "btn-primary" : "btn-secondary"} onClick={() => setMode("excel")} type="button">
          Importar Excel
        </button>
        <a className="btn-secondary" href="/api/admin/questions/import-template?format=json">
          Baixar modelo JSON
        </a>
        <a className="btn-secondary" href="/api/admin/questions/import-template?format=xlsx">
          Baixar modelo Excel
        </a>
      </div>

      <div>
        <label className="field-label">Disciplina padrão</label>
        <select className="input-base" required value={fallbackDisciplineId} onChange={(event) => setFallbackDisciplineId(event.target.value)}>
          {disciplines.map((discipline) => (
            <option key={discipline.id} value={discipline.id}>
              {discipline.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Modelo esperado</p>
        <p className="mt-1">
          O arquivo agora prevê contexto, tipo de suporte visual, código de apoio, comando da questão, feedback esperado,
          explicação da resposta, temas para estudo, links de apoio, playlist/URL de referência e alternativas.
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
          Em Excel use as colunas alternativeA até alternativeE, correctAlternative, visualSupportType, supportCode, studyTopics e studyLinks.
        </p>
      </div>

      {mode === "json" ? (
        <div className="space-y-3">
          <label className="field-label">Conteúdo JSON</label>
          <textarea className="input-base min-h-72 font-mono text-xs" spellCheck={false} value={content} onChange={(event) => setContent(event.target.value)} />
          <button className="btn-secondary" onClick={previewJson} type="button">
            Gerar pré-visualização
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="field-label">Arquivo Excel (.xlsx)</label>
          <label className="surface-panel block cursor-pointer p-5 text-center">
            <span className="btn-secondary">Selecionar arquivo Excel</span>
            <input className="hidden" accept=".xlsx,.xls,.csv" onChange={(event) => previewExcel(event.target.files?.[0])} type="file" />
            <p className="mt-3 text-sm text-slate-500">{fileName || "Nenhum arquivo selecionado."}</p>
          </label>
        </div>
      )}

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      {previewCount > 0 ? (
        <div className="surface-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">Pré-visualização</h3>
              <p className="text-sm text-slate-500">{previewCount} questão(ões) preparadas para importação.</p>
            </div>
            <button className="btn-primary" disabled={isPending} type="submit">
              {isPending ? "Importando..." : "Confirmar importação"}
            </button>
          </div>

          <div className="space-y-3">
            {previewQuestions.slice(0, 5).map((question) => {
              const disciplineName = disciplines.find((discipline) => discipline.id === question.disciplineId)?.name || "Disciplina";

              return (
                <div key={question.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {question.code} · {question.type}
                  </p>
                  {question.context ? <p className="mt-2 text-sm text-slate-500">Contexto: {question.context}</p> : null}
                  <p className="mt-2 text-sm text-slate-700">Comando: {question.statement}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                    {disciplineName} · {question.subject} · {question.difficulty} · suporte {question.visualSupportType.toLowerCase()}
                  </p>
                </div>
              );
            })}
            {previewQuestions.length > 5 ? <p className="text-sm text-slate-500">Mostrando 5 itens de {previewQuestions.length}.</p> : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
