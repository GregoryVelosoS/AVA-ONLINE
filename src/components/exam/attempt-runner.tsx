"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CONFIDENCE_LEVELS } from "@/lib/constants";
import { VisualSupportBlock } from "@/components/questions/visual-support-block";

type Option = { id: string; label: string; content: string };
type Question = {
  id: string;
  code: string;
  context?: string | null;
  statement: string;
  type: "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
  visualSupportType?: "NONE" | "ASSET" | "CODE" | null;
  supportCode?: string | null;
  supportImagePath?: string | null;
  supportImageName?: string | null;
  supportFilePath?: string | null;
  supportFileName?: string | null;
  options: Option[];
};

type AnswerDraft = {
  selectedOptionId?: string;
  shortTextAnswer?: string;
  longTextAnswer?: string;
  confidenceLevel?: number;
  fileName?: string;
};

function isAnswered(answer: AnswerDraft | undefined, type: Question["type"]) {
  if (!answer) {
    return false;
  }

  if (type === "MULTIPLE_CHOICE") {
    return Boolean(answer.selectedOptionId);
  }

  if (type === "FILE_UPLOAD") {
    return Boolean(answer.fileName);
  }

  return Boolean(answer.shortTextAnswer || answer.longTextAnswer);
}

function formatSeconds(value: number) {
  const safeValue = Math.max(0, value);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function AttemptRunner({
  attemptId,
  questions,
  initialAnswers,
  startedAt,
  timeLimitMinutes
}: {
  attemptId: string;
  questions: Question[];
  initialAnswers: Array<AnswerDraft & { questionId: string }>;
  startedAt: string;
  timeLimitMinutes: number | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutTriggeredRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>(
    Object.fromEntries(initialAnswers.map((answer) => [answer.questionId, answer]))
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const startedAtMs = useMemo(() => new Date(startedAt).getTime(), [startedAt]);
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const totalSeconds = timeLimitMinutes ? timeLimitMinutes * 60 : null;
  const remainingSeconds = totalSeconds == null ? null : Math.max(0, totalSeconds - elapsedSeconds);

  useEffect(() => {
    async function handleTimeout() {
      if (timeoutTriggeredRef.current || remainingSeconds == null || remainingSeconds > 0) {
        return;
      }

      timeoutTriggeredRef.current = true;
      setTimedOut(true);
      setSaveMessage("Tempo encerrado. Finalizando a tentativa automaticamente...");

      const response = await fetch("/api/public/attempts/timeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId })
      });

      if (response.ok) {
        router.push(`/submitted/${attemptId}?timeout=1`);
        return;
      }

      const payload = (await response.json()) as { error?: string };
      setSaveMessage(payload.error || "Não foi possível finalizar automaticamente.");
    }

    void handleTimeout();
  }, [attemptId, remainingSeconds, router]);

  const question = questions[current];
  const answer = answers[question.id] ?? {};
  const answeredCount = questions.filter((item) => isAnswered(answers[item.id], item.type)).length;

  async function persistAnswer(questionId: string, draft: AnswerDraft) {
    if (timedOut || questions.find((item) => item.id === questionId)?.type === "FILE_UPLOAD") {
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const response = await fetch("/api/public/attempts/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId,
        selectedOptionId: draft.selectedOptionId,
        shortTextAnswer: draft.shortTextAnswer,
        longTextAnswer: draft.longTextAnswer,
        confidenceLevel: draft.confidenceLevel ?? 2
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setSaveMessage(payload.error || "Falha ao salvar resposta.");
      setSaving(false);
      return;
    }

    setSaveMessage("Resposta salva.");
    setSaving(false);
  }

  function patchAnswer(questionId: string, patch: Partial<AnswerDraft>) {
    const nextAnswer = { ...(answers[questionId] ?? {}), ...patch };
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: nextAnswer
    }));
    return nextAnswer;
  }

  async function selectOption(optionId: string) {
    const nextAnswer = patchAnswer(question.id, {
      selectedOptionId: optionId,
      confidenceLevel: answer.confidenceLevel ?? 2
    });
    await persistAnswer(question.id, nextAnswer);
  }

  async function selectConfidence(confidenceLevel: number) {
    const nextAnswer = patchAnswer(question.id, { confidenceLevel });
    await persistAnswer(question.id, nextAnswer);
  }

  async function handleTextBlur() {
    const nextAnswer = answers[question.id] ?? {};
    await persistAnswer(question.id, {
      ...nextAnswer,
      confidenceLevel: nextAnswer.confidenceLevel ?? 2
    });
  }

  function handleFileChange(file: File | undefined) {
    patchAnswer(question.id, { fileName: file?.name });
    setSaveMessage("Arquivo selecionado. O envio real da resposta por arquivo continua preparado como próxima etapa.");
  }

  return (
    <div className="space-y-4">
      <div className="surface-dark p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">Progresso da prova</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">Questão atual</p>
                <p className="mt-1 text-xl font-black">
                  {current + 1}/{questions.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">Respondidas</p>
                <p className="mt-1 text-xl font-black">{answeredCount}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row">
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-red-200">Tempo decorrido</p>
              <p className="mt-1 text-2xl font-black">{formatSeconds(elapsedSeconds)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Tempo restante</p>
              <p className={`mt-1 text-2xl font-black ${remainingSeconds != null && remainingSeconds <= 60 ? "text-red-300" : ""}`}>
                {remainingSeconds == null ? "Sem limite" : formatSeconds(remainingSeconds)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Status</p>
              <p className="mt-1 text-sm font-semibold text-white/90">{saving ? "Salvando..." : saveMessage || "Prova em andamento"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {questions.map((item, index) => {
            const active = item.id === question.id;
            const answered = isAnswered(answers[item.id], item.type);

            return (
              <button
                key={item.id}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "border-red-400 bg-[linear-gradient(135deg,#c1121f_0%,#8b0c16_100%)] text-white shadow-[0_12px_24px_rgba(193,18,31,0.34)]"
                    : answered
                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "border-white/10 bg-white/5 text-white/80"
                ].join(" ")}
                onClick={() => setCurrent(index)}
                type="button"
              >
                {index + 1} {answered ? "· respondida" : "· pendente"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface-panel space-y-6 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{question.code}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Questão {current + 1}</h2>
        </div>

        {question.context ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Contexto</p>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-700">{question.context}</p>
          </section>
        ) : null}

        <VisualSupportBlock
          visualSupportType={question.visualSupportType}
          supportCode={question.supportCode}
          supportImageName={question.supportImageName}
          supportImagePath={question.supportImagePath}
          supportFileName={question.supportFileName}
          supportFilePath={question.supportFilePath}
        />

        <section className="rounded-[28px] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,247,0.98)_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Comando da questão</p>
          <p className="mt-3 whitespace-pre-line text-lg font-semibold leading-8 text-slate-950">{question.statement}</p>
        </section>

        {question.type === "MULTIPLE_CHOICE" ? (
          <section className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Alternativas</p>
            {question.options.map((option) => {
              const selected = answer.selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  className={[
                    "block w-full rounded-2xl border px-4 py-4 text-left transition",
                    selected
                      ? "border-red-500 bg-[linear-gradient(135deg,rgba(193,18,31,0.12)_0%,rgba(255,230,232,0.96)_100%)] text-slate-950 ring-4 ring-red-100 shadow-[0_14px_32px_rgba(193,18,31,0.18)]"
                      : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                  ].join(" ")}
                  onClick={() => selectOption(option.id)}
                  type="button"
                >
                  <span className="font-black text-red-700">{option.label})</span> {option.content}
                </button>
              );
            })}
          </section>
        ) : question.type === "SHORT_TEXT" ? (
          <section className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Resposta</p>
            <input
              className="input-base"
              placeholder="Digite uma resposta curta"
              value={answer.shortTextAnswer ?? ""}
              onBlur={handleTextBlur}
              onChange={(event) => patchAnswer(question.id, { shortTextAnswer: event.target.value })}
            />
          </section>
        ) : question.type === "LONG_TEXT" ? (
          <section className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Resposta</p>
            <textarea
              className="input-base min-h-40"
              placeholder="Digite sua resposta"
              value={answer.longTextAnswer ?? ""}
              onBlur={handleTextBlur}
              onChange={(event) => patchAnswer(question.id, { longTextAnswer: event.target.value })}
            />
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-red-200 bg-red-50/70 p-4">
            <p className="text-sm text-slate-700">Selecione o arquivo da resposta. A interface já está pronta para a etapa de upload real.</p>
            <input className="mt-3 block w-full text-sm" onChange={(event) => handleFileChange(event.target.files?.[0])} type="file" />
            {answer.fileName ? <p className="mt-3 text-sm font-semibold text-slate-900">Arquivo selecionado: {answer.fileName}</p> : null}
          </section>
        )}

        <section className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Nível de confiança</p>
          <div className="grid gap-2 md:grid-cols-3">
            {CONFIDENCE_LEVELS.map((confidence) => {
              const selected = answer.confidenceLevel === confidence.value;

              return (
                <button
                  key={confidence.value}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition",
                    selected
                      ? "border-black bg-[linear-gradient(135deg,#101010_0%,#2a0e12_100%)] text-white ring-4 ring-red-100 shadow-[0_16px_32px_rgba(15,15,17,0.34)]"
                      : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                  ].join(" ")}
                  type="button"
                  onClick={() => selectConfidence(confidence.value)}
                >
                  <p className={`text-sm font-black ${selected ? "text-red-300" : "text-red-700"}`}>{confidence.value}</p>
                  <p className="mt-1 text-sm font-semibold">{confidence.label}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex justify-between">
        <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} type="button">
          Anterior
        </button>
        {current < questions.length - 1 ? (
          <button className="btn-primary" onClick={() => setCurrent((value) => value + 1)} type="button">
            Próxima
          </button>
        ) : (
          <button className="btn-primary" onClick={() => router.push(`/attempt/${attemptId}/feedback`)} type="button">
            Finalizar prova
          </button>
        )}
      </div>
    </div>
  );
}
