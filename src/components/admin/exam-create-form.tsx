"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
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

export function ExamCreateForm({
  disciplines,
  classGroups,
  themes
}: {
  disciplines: Discipline[];
  classGroups: ClassGroup[];
  themes: Theme[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [publicCode, setPublicCode] = useState("");
  const [disciplineId, setDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [targetClassGroupId, setTargetClassGroupId] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableClassGroups = useMemo(
    () => classGroups.filter((classGroup) => !classGroup.disciplineId || classGroup.disciplineId === disciplineId),
    [classGroups, disciplineId]
  );

  function toggleTheme(themeId: string) {
    setThemeIds((current) => (current.includes(themeId) ? current.filter((id) => id !== themeId) : [...current, themeId]));
  }

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
        targetClassGroupId,
        timeLimitMinutes,
        themeIds,
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="field-label">Nome da prova</label>
        <input
          className="input-base"
          placeholder="Ex.: Avaliação diagnóstica de lógica"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">Disciplina vinculada</label>
          <select
            className="input-base"
            required
            value={disciplineId}
            onChange={(event) => {
              setDisciplineId(event.target.value);
              setTargetClassGroupId("");
            }}
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
          <select className="input-base" required value={targetClassGroupId} onChange={(event) => setTargetClassGroupId(event.target.value)}>
            <option value="">Selecione a turma</option>
            {availableClassGroups.map((classGroup) => (
              <option key={classGroup.id} value={classGroup.id}>
                {classGroup.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Duração da prova (minutos)</label>
        <input
          className="input-base"
          max={1440}
          min={1}
          required
          type="number"
          value={timeLimitMinutes}
          onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3">
          <p className="field-label">Temas da prova</p>
          <p className="text-sm text-slate-500">Esses temas alimentarão o feedback final e poderão ser usados em análises posteriores.</p>
        </div>

        {themes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum tema cadastrado ainda. A prova pode ser criada e os temas podem ser vinculados depois.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => {
              const selected = themeIds.includes(theme.id);

              return (
                <button
                  key={theme.id}
                  className={[
                    "rounded-full border px-3 py-2 text-sm font-semibold transition",
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

      {error ? <StatusBanner tone="error" message={error} /> : null}

      <button className="btn-primary" disabled={isPending || !disciplineId || !targetClassGroupId || !publicCode.trim()} type="submit">
        {isPending ? "Criando..." : "Criar prova"}
      </button>
    </form>
  );
}
