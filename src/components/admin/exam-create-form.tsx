"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
import { normalizePublicCode } from "@/lib/exam-status";

type Discipline = {
  id: string;
  name: string;
};

export function ExamCreateForm({ disciplines }: { disciplines: Discipline[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [publicCode, setPublicCode] = useState("");
  const [disciplineId, setDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        publicCode: normalizePublicCode(publicCode),
        disciplineId,
        timeLimitMinutes,
        status: "DRAFT",
        maxAttempts: 1,
        questionIds: []
      })
    });

    const payload = (await response.json()) as { error?: string; id?: string };

    if (!response.ok) {
      setError(payload.error || "Não foi possível criar a prova.");
      return;
    }

    startTransition(() => {
      router.push(`/admin/exams/${payload.id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="field-label">Nome da prova</label>
        <input className="input-base" placeholder="Ex.: Avaliação diagnóstica de lógica" required value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div>
        <label className="field-label">Código público da prova</label>
        <input
          className="input-base"
          placeholder="Ex.: LOGICA2026"
          required
          value={publicCode}
          onChange={(event) => setPublicCode(event.target.value.toUpperCase())}
        />
      </div>

      <div>
        <label className="field-label">Disciplina</label>
        <select className="input-base" required value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
          {disciplines.map((discipline) => (
            <option key={discipline.id} value={discipline.id}>
              {discipline.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">Duração da prova (minutos)</label>
        <input className="input-base" max={1440} min={1} required type="number" value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(Number(event.target.value))} />
      </div>

      {error ? <StatusBanner tone="error" message={error} /> : null}

      <button className="btn-primary" disabled={isPending || !disciplineId || !publicCode.trim()} type="submit">
        {isPending ? "Criando..." : "Criar prova"}
      </button>
    </form>
  );
}
