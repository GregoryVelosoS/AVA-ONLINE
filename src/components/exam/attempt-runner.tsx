"use client";

import { useState } from "react";
import { CONFIDENCE_LEVELS } from "@/lib/constants";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string; content: string };
type Question = {
  id: string;
  code: string;
  statement: string;
  type: "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
  options: Option[];
};

export function AttemptRunner({ attemptId, questions }: { attemptId: string; questions: Question[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const q = questions[current];

  async function saveAnswer(payload: { selectedOptionId?: string; shortTextAnswer?: string; longTextAnswer?: string; confidenceLevel: number; }) {
    setSaving(true);
    await fetch("/api/public/attempts/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, questionId: q.id, ...payload })
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Questão {current + 1} de {questions.length} · {saving ? "salvando..." : "salvo"}</p>
      <div className="rounded border bg-white p-4">
        <p className="mb-3 font-semibold">{q.code} — {q.statement}</p>

        {q.type === "MULTIPLE_CHOICE" ? (
          <div className="space-y-2">
            {q.options.map((o) => (
              <button
                key={o.id}
                className="block w-full rounded border px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => saveAnswer({ selectedOptionId: o.id, confidenceLevel: 2 })}
                type="button"
              >
                {o.label}) {o.content}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            className="min-h-28 w-full rounded border px-3 py-2"
            placeholder="Digite sua resposta"
            onBlur={(e) => saveAnswer({ longTextAnswer: e.target.value, confidenceLevel: 2 })}
          />
        )}

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium">Nível de confiança</p>
          <div className="flex gap-2">
            {CONFIDENCE_LEVELS.map((c) => (
              <button
                key={c.value}
                className="rounded border px-3 py-1 text-sm"
                type="button"
                onClick={() => saveAnswer({ confidenceLevel: c.value })}
              >
                {c.value} - {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" className="rounded border px-3 py-2" disabled={current === 0} onClick={() => setCurrent((p) => p - 1)}>
          Anterior
        </button>
        {current < questions.length - 1 ? (
          <button type="button" className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => setCurrent((p) => p + 1)}>
            Próxima
          </button>
        ) : (
          <button type="button" className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={() => router.push(`/attempt/${attemptId}/feedback`)}>
            Finalizar prova
          </button>
        )}
      </div>
    </div>
  );
}
