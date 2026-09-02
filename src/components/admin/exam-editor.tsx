"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizePublicCode } from "@/lib/exam-status";

type Discipline = {
  id: string;
  name: string;
};

type ClassGroup = {
  id: string;
  name: string;
  disciplineId?: string | null;
};

type Theme = {
  id: string;
  code: string;
  name: string;
};

type Question = {
  id: string;
  code: string;
  statement: string;
  type: string;
  difficulty: string;
  discipline: {
    name: string;
  };
  createdAt: string | Date;
};

type Exam = {
  id: string;
  title: string;
  publicCode: string;
  description: string | null;
  disciplineId: string;
  targetClassGroupId: string;
  instructions: string;
  startAt: string;
  endAt: string;
  timeLimitMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  maxAttempts: number;
  themeIds: string[];
  publicLinks: { slug: string; isActive: boolean }[];
  questions: { questionId: string; position: number; question: Question }[];
};

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ExamEditor({
  exam,
  disciplines,
  classGroups,
  themes,
  availableQuestions
}: {
  exam: Exam;
  disciplines: Discipline[];
  classGroups: ClassGroup[];
  themes: Theme[];
  availableQuestions: Question[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSavingQuestions, startSavingQuestions] = useTransition();
  const [form, setForm] = useState({
    title: exam.title,
    publicCode: exam.publicCode,
    description: exam.description ?? "",
    disciplineId: exam.disciplineId,
    targetClassGroupId: exam.targetClassGroupId,
    instructions: exam.instructions,
    startAt: toLocalInputValue(exam.startAt),
    endAt: toLocalInputValue(exam.endAt),
    timeLimitMinutes: exam.timeLimitMinutes ?? 60,
    status: exam.status,
    maxAttempts: exam.maxAttempts,
    themeIds: exam.themeIds,
    questionIds: exam.questions.map((item) => item.questionId)
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSort, setFilterSort] = useState("name_asc");

  const [selectedFilterSearch, setSelectedFilterSearch] = useState("");
  const [selectedFilterType, setSelectedFilterType] = useState("");
  const [selectedFilterDiscipline, setSelectedFilterDiscipline] = useState("");
  const [selectedFilterDifficulty, setSelectedFilterDifficulty] = useState("");

  const availableClassGroups = useMemo(
    () => classGroups.filter((classGroup) => !classGroup.disciplineId || classGroup.disciplineId === form.disciplineId),
    [classGroups, form.disciplineId]
  );

  function toggleTheme(themeId: string) {
    setForm((current) => ({
      ...current,
      themeIds: current.themeIds.includes(themeId)
        ? current.themeIds.filter((id) => id !== themeId)
        : [...current.themeIds, themeId]
    }));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.questionIds.length) {
        return current;
      }

      const nextQuestionIds = [...current.questionIds];
      const [item] = nextQuestionIds.splice(index, 1);
      nextQuestionIds.splice(nextIndex, 0, item);
      return { ...current, questionIds: nextQuestionIds };
    });
  }

  function addQuestion(questionId: string) {
    setForm((current) => {
      if (current.questionIds.includes(questionId)) {
        return current;
      }

      return {
        ...current,
        questionIds: [...current.questionIds, questionId]
      };
    });
  }

  function removeQuestion(questionId: string) {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.filter((id) => id !== questionId)
    }));
  }

  async function saveExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        publicCode: normalizePublicCode(form.publicCode),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString()
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error || "Não foi possível salvar a prova.");
      return;
    }

    setSuccess("Dados da prova atualizados com sucesso.");
    startTransition(() => router.refresh());
  }

  async function saveQuestions() {
    setQuestionMessage(null);

    const response = await fetch(`/api/admin/exams/${exam.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionIds: form.questionIds
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setQuestionMessage(payload.error || "Não foi possível salvar as questões.");
      return;
    }

    setQuestionMessage("Sequência de questões salva com sucesso.");
    startSavingQuestions(() => router.refresh());
  }

  const selectedQuestions = form.questionIds
    .map((questionId) => availableQuestions.find((question) => question.id === questionId))
    .filter((question): question is Question => Boolean(question));

  const hasSelectedFilter = Boolean(selectedFilterSearch || selectedFilterType || selectedFilterDiscipline || selectedFilterDifficulty);

  const filteredSelectedQuestions = selectedQuestions.filter((question) => {
    if (selectedFilterSearch && !question.code.toLowerCase().includes(selectedFilterSearch.toLowerCase()) && !question.statement.toLowerCase().includes(selectedFilterSearch.toLowerCase())) return false;
    if (selectedFilterType && question.type !== selectedFilterType) return false;
    if (selectedFilterDiscipline && question.discipline.name !== selectedFilterDiscipline) return false;
    if (selectedFilterDifficulty && question.difficulty !== selectedFilterDifficulty) return false;
    return true;
  });

  const availableToAdd = availableQuestions.filter((question) => !form.questionIds.includes(question.id));

  let filteredAvailableToAdd = availableToAdd.filter((question) => {
    if (filterSearch && !question.code.toLowerCase().includes(filterSearch.toLowerCase()) && !question.statement.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (filterType && question.type !== filterType) return false;
    if (filterDiscipline && question.discipline.name !== filterDiscipline) return false;
    if (filterDifficulty && question.difficulty !== filterDifficulty) return false;
    return true;
  });

  filteredAvailableToAdd = [...filteredAvailableToAdd].sort((a, b) => {
    if (filterSort === "name_asc") {
      return a.code.localeCompare(b.code);
    }
    if (filterSort === "name_desc") {
      return b.code.localeCompare(a.code);
    }
    if (filterSort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (filterSort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <form className="surface-panel space-y-5 p-5 md:p-6" onSubmit={saveExam}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">Nome da prova</label>
            <input className="input-base" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </div>

          <div>
            <label className="field-label">Código público</label>
            <input className="input-base" required value={form.publicCode} onChange={(event) => setForm((current) => ({ ...current, publicCode: event.target.value.toUpperCase() }))} />
          </div>

          <div>
            <label className="field-label">Disciplina vinculada</label>
            <select
              className="input-base"
              required
              value={form.disciplineId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  disciplineId: event.target.value,
                  targetClassGroupId: ""
                }))
              }
            >
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Turma vinculada</label>
            <select className="input-base" required value={form.targetClassGroupId} onChange={(event) => setForm((current) => ({ ...current, targetClassGroupId: event.target.value }))}>
              <option value="">Selecione a turma</option>
              {availableClassGroups.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Status</label>
            <select className="input-base" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Exam["status"] }))}>
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Ativa/Publicada</option>
              <option value="CLOSED">Encerrada</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </div>

          <div>
            <label className="field-label">Duração da prova (minutos)</label>
            <input className="input-base" max={1440} min={1} type="number" value={form.timeLimitMinutes} onChange={(event) => setForm((current) => ({ ...current, timeLimitMinutes: Number(event.target.value) }))} />
          </div>

          <div>
            <label className="field-label">Início</label>
            <input className="input-base" required type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} />
          </div>

          <div>
            <label className="field-label">Fim</label>
            <input className="input-base" required type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} />
          </div>

          <div>
            <label className="field-label">Máximo de tentativas</label>
            <input className="input-base" min={1} type="number" value={form.maxAttempts} onChange={(event) => setForm((current) => ({ ...current, maxAttempts: Number(event.target.value) }))} />
          </div>

          <div className="md:col-span-3">
            <label className="field-label">Descrição</label>
            <textarea className="input-base min-h-24" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>

          <div className="md:col-span-3">
            <label className="field-label">Instruções</label>
            <textarea className="input-base min-h-24" value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3">
            <p className="field-label">Temas vinculados à prova</p>
            <p className="text-lg text-slate-500">Somente esses temas aparecerão na pergunta final sobre conteúdos com maior dificuldade.</p>
          </div>

          {themes.length === 0 ? (
            <p className="text-lg text-slate-500">Nenhum tema cadastrado. Cadastre primeiro em Temas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => {
                const selected = form.themeIds.includes(theme.id);

                return (
                  <button
                    key={theme.id}
                    className={[
                      "rounded-full border px-3 py-2 text-lg font-semibold transition",
                      selected ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:border-red-200"
                    ].join(" ")}
                    onClick={() => toggleTheme(theme.id)}
                    type="button"
                  >
                    {theme.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {exam.publicLinks[0] ? <StatusBanner message={`Link público atual: /exam/${exam.publicLinks[0].slug} (${exam.publicLinks[0].isActive ? "ativo" : "inativo"})`} tone="info" /> : null}
        {error ? <StatusBanner tone="error" message={error} /> : null}
        {success ? <StatusBanner tone="success" message={success} /> : null}

        <button className="btn-primary" disabled={isPending || !form.targetClassGroupId} type="submit">
          {isPending ? "Salvando..." : "Salvar dados da prova"}
        </button>
      </form>

      <section className="grid gap-6">

        <div className="surface-panel space-y-4 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Questões da prova</h2>
              <p className="text-lg text-slate-500">Reordene, remova ou edite as questões já vinculadas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary" href="/admin/questions">
                Nova questão
              </Link>
              <button className="btn-primary" disabled={isSavingQuestions} onClick={saveQuestions} type="button">
                {isSavingQuestions ? "Salvando..." : "Salvar sequência"}
              </button>
            </div>
          </div>

          {questionMessage ? <StatusBanner tone={questionMessage.includes("sucesso") ? "success" : "error"} message={questionMessage} /> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input 
              className="input-base" 
              placeholder="Buscar por código ou texto..." 
              value={selectedFilterSearch} 
              onChange={(e) => setSelectedFilterSearch(e.target.value)} 
            />
            <select className="input-base" value={selectedFilterType} onChange={(e) => setSelectedFilterType(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
              <option value="SHORT_TEXT">Texto Curto</option>
              <option value="LONG_TEXT">Texto Longo</option>
              <option value="FILE_UPLOAD">Envio de Arquivo</option>
            </select>
            <select className="input-base" value={selectedFilterDiscipline} onChange={(e) => setSelectedFilterDiscipline(e.target.value)}>
              <option value="">Todas as disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select className="input-base" value={selectedFilterDifficulty} onChange={(e) => setSelectedFilterDifficulty(e.target.value)}>
              <option value="">Todas as dificuldades</option>
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Médio</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>

          {selectedQuestions.length === 0 ? (
            <EmptyState title="Nenhuma questão vinculada" description="Adicione questões na lista abaixo para montar a prova." />
          ) : filteredSelectedQuestions.length === 0 ? (
            <EmptyState title="Nenhuma questão encontrada" description="Ajuste os filtros acima para ver mais questões já vinculadas." />
          ) : (
            <div className="space-y-3">
              {filteredSelectedQuestions.map((question) => {
                const realIndex = form.questionIds.indexOf(question.id);
                
                return (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-950">
                          {realIndex + 1}. {question.code}
                        </p>
                        <p className="text-lg text-slate-600 line-clamp-2" title={question.statement}>{question.statement}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                          {question.type} · {question.discipline.name} · {question.difficulty}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Link className="btn-secondary" href={`/admin/questions/${question.id}`}>
                          Editar
                        </Link>
                        {!hasSelectedFilter && (
                          <>
                            <button className="btn-secondary" onClick={() => moveQuestion(realIndex, -1)} type="button">
                              Subir
                            </button>
                            <button className="btn-secondary" onClick={() => moveQuestion(realIndex, 1)} type="button">
                              Descer
                            </button>
                          </>
                        )}
                        <button className="btn-danger" onClick={() => removeQuestion(question.id)} type="button">
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface-panel space-y-4 p-5 md:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Banco disponível</h2>
            <p className="text-lg text-slate-500">Selecione questões existentes para incluir na prova.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input 
              className="input-base" 
              placeholder="Buscar por código ou texto..." 
              value={filterSearch} 
              onChange={(e) => setFilterSearch(e.target.value)} 
            />
            <select className="input-base" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
              <option value="SHORT_TEXT">Texto Curto</option>
              <option value="LONG_TEXT">Texto Longo</option>
              <option value="FILE_UPLOAD">Envio de Arquivo</option>
            </select>
            <select className="input-base" value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)}>
              <option value="">Todas as disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select className="input-base" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
              <option value="">Todas as dificuldades</option>
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Médio</option>
              <option value="HARD">Difícil</option>
            </select>
            <select className="input-base" value={filterSort} onChange={(e) => setFilterSort(e.target.value)}>
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
            </select>
          </div>

          {availableQuestions.length === 0 ? (
            <EmptyState title="Nenhuma questão cadastrada" description="Cadastre questões no banco para começar a montar a prova." />
          ) : availableToAdd.length === 0 ? (
            <EmptyState title="Todas as questões já foram adicionadas" description="Você pode reorganizar a ordem ou remover alguma questão da prova." />
          ) : filteredAvailableToAdd.length === 0 ? (
            <EmptyState title="Nenhuma questão encontrada" description="Ajuste os filtros acima para ver mais questões." />
          ) : (
            <div className="space-y-3">
              {filteredAvailableToAdd.map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-950">{question.code}</p>
                      <p className="text-lg text-slate-600 line-clamp-2" title={question.statement}>{question.statement}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                        {question.type} · {question.discipline.name} · {question.difficulty}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link className="btn-secondary" href={`/admin/questions/${question.id}`}>
                        Editar
                      </Link>
                      <button className="btn-primary" onClick={() => addQuestion(question.id)} type="button">
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
