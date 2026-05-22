"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionDeleteButton } from "@/components/admin/question-delete-button";
import { VisualSupportBlock } from "@/components/questions/visual-support-block";

type QuestionOption = {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
  position: number;
};

export type QuestionListItem = {
  id: string;
  code: string;
  type: string;
  title: string | null;
  disciplineName: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  context: string | null;
  statement: string;
  visualSupportType: "NONE" | "ASSET" | "CODE";
  supportCode: string | null;
  supportImagePath: string | null;
  supportImageName: string | null;
  supportFilePath: string | null;
  supportFileName: string | null;
  status: string;
  createdAt: string;
  options: QuestionOption[];
};

type SortKey = "code" | "type" | "disciplineName" | "difficulty" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const questionTypeLabels: Record<string, string> = {
  FILE_UPLOAD: "Arquivo",
  LONG_TEXT: "Texto longo",
  MULTIPLE_CHOICE: "Múltipla escolha",
  SHORT_TEXT: "Texto curto"
};

const difficultyLabels: Record<string, string> = {
  EASY: "Fácil",
  HARD: "Difícil",
  MEDIUM: "Média"
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
  DRAFT: "Rascunho"
};

function displayLabel(map: Record<string, string>, value: string) {
  return map[value] || value;
}

function compareValues(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function QuestionManagementList({
  questions,
  disciplines
}: {
  questions: QuestionListItem[];
  disciplines: string[];
}) {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionListItem | null>(null);

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return questions
      .filter((question) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            question.code,
            question.title || "",
            question.subject,
            question.topic || "",
            question.statement,
            question.context || "",
            question.disciplineName
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);

        return (
          matchesQuery &&
          (discipline === "ALL" || question.disciplineName === discipline) &&
          (type === "ALL" || question.type === type) &&
          (difficulty === "ALL" || question.difficulty === difficulty) &&
          (status === "ALL" || question.status === status)
        );
      })
      .sort((a, b) => {
        if (sortKey === "createdAt") {
          const result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortDirection === "asc" ? result : -result;
        }

        return compareValues(String(a[sortKey]), String(b[sortKey]), sortDirection);
      });
  }, [difficulty, discipline, query, questions, sortDirection, sortKey, status, type]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) {
      return "";
    }

    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <>
      <Card title="Filtros das questões">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <input
            className="input-base"
            placeholder="Buscar por código, enunciado, assunto ou disciplina"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="input-base" value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
            <option value="ALL">Todas as disciplinas</option>
            {disciplines.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="input-base" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="ALL">Todos os tipos</option>
            {Object.entries(questionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="input-base" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="ALL">Todos os níveis</option>
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="input-base" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-lg text-slate-600">
          Exibindo {filteredQuestions.length} de {questions.length} questão(ões).
        </p>
      </Card>

      <Card title="Questões cadastradas">
        {questions.length === 0 ? (
          <EmptyState title="Nenhuma questão cadastrada" description="Use o formulário acima ou importe um lote inicial de questões." />
        ) : filteredQuestions.length === 0 ? (
          <EmptyState title="Nenhuma questão encontrada" description="Ajuste os filtros para ampliar a busca." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-lg">
              <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-center text-white">
                <tr>
                  <SortableHeader label="Código" sortKey="code" indicator={sortIndicator("code")} onSort={toggleSort} />
                  <SortableHeader label="Tipo" sortKey="type" indicator={sortIndicator("type")} onSort={toggleSort} />
                  <SortableHeader label="Disciplina" sortKey="disciplineName" indicator={sortIndicator("disciplineName")} onSort={toggleSort} />
                  <SortableHeader label="Nível" sortKey="difficulty" indicator={sortIndicator("difficulty")} onSort={toggleSort} />
                  <SortableHeader label="Status" sortKey="status" indicator={sortIndicator("status")} onSort={toggleSort} />
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{question.code}</td>
                    <td className="px-4 py-3">{displayLabel(questionTypeLabels, question.type)}</td>
                    <td className="px-4 py-3">{question.disciplineName}</td>
                    <td className="px-4 py-3">{displayLabel(difficultyLabels, question.difficulty)}</td>
                    <td className="px-4 py-3">{displayLabel(statusLabels, question.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button className="btn-secondary" type="button" onClick={() => setSelectedQuestion(question)}>
                          Visualizar
                        </button>
                        <Link className="btn-secondary" href={`/admin/questions/${question.id}`}>
                          Editar
                        </Link>
                        <QuestionDeleteButton questionId={question.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedQuestion ? <QuestionPreviewModal question={selectedQuestion} onClose={() => setSelectedQuestion(null)} /> : null}
    </>
  );
}

function SortableHeader({
  label,
  sortKey,
  indicator,
  onSort
}: {
  label: string;
  sortKey: SortKey;
  indicator: string;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th className="px-4 py-3">
      <button className="inline-flex items-center font-semibold text-white" type="button" onClick={() => onSort(sortKey)}>
        {label}
        {indicator}
      </button>
    </th>
  );
}

function QuestionPreviewModal({ question, onClose }: { question: QuestionListItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl md:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{question.code}</p>
            <h3 className="text-xl font-black tracking-tight text-slate-950">{question.title || question.subject}</h3>
            <p className="text-lg text-slate-600">
              {question.disciplineName} · {displayLabel(questionTypeLabels, question.type)} · {displayLabel(difficultyLabels, question.difficulty)}
            </p>
          </div>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="space-y-5">
          {question.context ? (
            <PreviewSection title="Contexto">
              <p className="whitespace-pre-wrap text-lg leading-6 text-slate-700">{question.context}</p>
            </PreviewSection>
          ) : null}

          <VisualSupportBlock
            visualSupportType={question.visualSupportType}
            supportCode={question.supportCode}
            supportImagePath={question.supportImagePath}
            supportImageName={question.supportImageName}
            supportFilePath={question.supportFilePath}
            supportFileName={question.supportFileName}
          />
          
          <PreviewSection title="Comando">
            <p className="whitespace-pre-wrap text-lg leading-6 text-slate-800">{question.statement}</p>
          </PreviewSection>



          <PreviewSection title="Alternativas">
            {question.options.length === 0 ? (
              <p className="text-lg text-slate-600">Esta questão não possui alternativas cadastradas.</p>
            ) : (
              <div className="space-y-2">
                {[...question.options]
                  .sort((a, b) => a.position - b.position)
                  .map((option) => (
                    <div
                      key={option.id}
                      className={`rounded-xl border p-3 ${
                        option.isCorrect ? "border-green-300 bg-green-50 text-green-950" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <p className="whitespace-pre-wrap text-lg leading-6">
                          <span className="font-bold">{option.label}) </span>
                          {option.content}
                        </p>
                        {option.isCorrect ? (
                          <span className="inline-flex shrink-0 rounded-full border border-green-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-green-700">
                            Correta
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </PreviewSection>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-2 text-lg font-black uppercase tracking-[0.14em] text-slate-700">{title}</h4>
      {children}
    </section>
  );
}
