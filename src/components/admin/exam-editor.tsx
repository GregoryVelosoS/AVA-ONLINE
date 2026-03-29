"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
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
};

type Exam = {
  id: string;
  title: string;
  publicCode: string;
  description: string | null;
  disciplineId: string;
  targetClassGroupId: string | null;
  instructions: string;
  startAt: string;
  endAt: string;
  timeLimitMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  maxAttempts: number;
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
  availableQuestions
}: {
  exam: Exam;
  disciplines: Discipline[];
  classGroups: ClassGroup[];
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
    targetClassGroupId: exam.targetClassGroupId ?? "",
    instructions: exam.instructions,
    startAt: toLocalInputValue(exam.startAt),
    endAt: toLocalInputValue(exam.endAt),
    timeLimitMinutes: exam.timeLimitMinutes ?? 60,
    status: exam.status,
    maxAttempts: exam.maxAttempts,
    questionIds: exam.questions.map((item) => item.questionId)
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

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

  const availableToAdd = availableQuestions.filter((question) => !form.questionIds.includes(question.id));

  return (
    <div className="space-y-6">
      <form className="surface-panel space-y-4 p-5 md:p-6" onSubmit={saveExam}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Nome da prova</label>
            <input className="input-base" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div>
            <label className="field-label">Código público</label>
            <input className="input-base" required value={form.publicCode} onChange={(event) => setForm((current) => ({ ...current, publicCode: event.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="field-label">Disciplina</label>
            <select className="input-base" required value={form.disciplineId} onChange={(event) => setForm((current) => ({ ...current, disciplineId: event.target.value }))}>
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Turma-alvo</label>
            <select className="input-base" value={form.targetClassGroupId} onChange={(event) => setForm((current) => ({ ...current, targetClassGroupId: event.target.value }))}>
              <option value="">Sem turma fixa</option>
              {classGroups.map((classGroup) => (
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
          <div className="md:col-span-2">
            <label className="field-label">Descrição</label>
            <textarea className="input-base min-h-24" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">Instruções</label>
            <textarea className="input-base min-h-24" value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
          </div>
        </div>

        {exam.publicLinks[0] ? <StatusBanner message={`Link público atual: /exam/${exam.publicLinks[0].slug} (${exam.publicLinks[0].isActive ? "ativo" : "inativo"})`} tone="info" /> : null}
        {error ? <StatusBanner tone="error" message={error} /> : null}
        {success ? <StatusBanner tone="success" message={success} /> : null}

        <button className="btn-primary" disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar dados da prova"}
        </button>
      </form>

      <section className="grid gap-6">
        <div className="surface-panel space-y-4 p-5 md:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Banco disponível</h2>
            <p className="text-sm text-slate-500">Selecione questões existentes para incluir na prova.</p>
          </div>

          {availableQuestions.length === 0 ? (
            <EmptyState title="Nenhuma questão cadastrada" description="Cadastre questões no banco para começar a montar a prova." />
          ) : availableToAdd.length === 0 ? (
            <EmptyState title="Todas as questões já foram adicionadas" description="Você pode reorganizar a ordem ou remover alguma questão da prova." />
          ) : (
            <div className="space-y-3">
              {availableToAdd.map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{question.code}</p>
                      <p className="text-sm text-slate-600">{question.statement}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                        {question.type} · {question.discipline.name} · {question.difficulty}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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

        <div className="surface-panel space-y-4 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Questões da prova</h2>
              <p className="text-sm text-slate-500">Reordene, remova ou edite as questões já vinculadas.</p>
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

          {selectedQuestions.length === 0 ? (
            <EmptyState title="Nenhuma questão vinculada" description="Adicione questões na lista acima para montar a prova." />
          ) : (
            <div className="space-y-3">
              {selectedQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">
                        {index + 1}. {question.code}
                      </p>
                      <p className="text-sm text-slate-600">{question.statement}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                        {question.type} · {question.discipline.name} · {question.difficulty}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link className="btn-secondary" href={`/admin/questions/${question.id}`}>
                        Editar
                      </Link>
                      <button className="btn-secondary" onClick={() => moveQuestion(index, -1)} type="button">
                        Subir
                      </button>
                      <button className="btn-secondary" onClick={() => moveQuestion(index, 1)} type="button">
                        Descer
                      </button>
                      <button className="btn-danger" onClick={() => removeQuestion(question.id)} type="button">
                        Remover
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
