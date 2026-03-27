"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StudentIdentifyForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [classGroupName, setClassGroupName] = useState("");
  const [disciplineInformed, setDisciplineInformed] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const response = await fetch("/api/public/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, studentName, classGroupName, disciplineInformed })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Não foi possível iniciar a prova");
      return;
    }

    const payload = (await response.json()) as { attemptId: string };
    router.push(`/attempt/${payload.attemptId}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full rounded border px-3 py-2" placeholder="Nome completo" required value={studentName} onChange={(e) => setStudentName(e.target.value)} />
      <input className="w-full rounded border px-3 py-2" placeholder="Turma" required value={classGroupName} onChange={(e) => setClassGroupName(e.target.value)} />
      <input className="w-full rounded border px-3 py-2" placeholder="Disciplina" required value={disciplineInformed} onChange={(e) => setDisciplineInformed(e.target.value)} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded bg-blue-600 px-3 py-2 text-white">Iniciar avaliação</button>
    </form>
  );
}
