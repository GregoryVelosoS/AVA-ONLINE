"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  name: string;
};

type ResolvedExam = {
  title: string;
  publicCode: string;
  description: string | null;
  disciplineId: string;
  disciplineName: string;
  targetClassGroupName?: string | null;
  timeLimitMinutes?: number | null;
  instructions?: string | null;
};

export function StudentIdentifyForm({
  classGroups,
  disciplines,
  initialExam
}: {
  classGroups: Option[];
  disciplines: Option[];
  initialExam?: ResolvedExam | null;
}) {
  const router = useRouter();
  const [publicCode, setPublicCode] = useState(initialExam?.publicCode ?? "");
  const [resolvedExam, setResolvedExam] = useState<ResolvedExam | null>(initialExam ?? null);
  const [studentName, setStudentName] = useState("");
  const [classGroupName, setClassGroupName] = useState(initialExam?.targetClassGroupName ?? classGroups[0]?.name ?? "");
  const [disciplineInformed, setDisciplineInformed] = useState(
    initialExam?.disciplineName ?? disciplines.find((discipline) => discipline.id === initialExam?.disciplineId)?.name ?? disciplines[0]?.name ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);

  const hasClassGroupOptions = classGroups.length > 0;
  const hasDisciplineOptions = disciplines.length > 0;

  const selectedDisciplineName = useMemo(
    () => disciplines.find((discipline) => discipline.id === resolvedExam?.disciplineId)?.name ?? disciplineInformed,
    [disciplines, disciplineInformed, resolvedExam?.disciplineId]
  );

  async function validateCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setLoadingLookup(true);

    const response = await fetch("/api/public/exams/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicCode })
    });

    const payload = (await response.json()) as {
      error?: string;
      exam?: ResolvedExam;
    };

    if (!response.ok || !payload.exam) {
      setResolvedExam(null);
      setError(payload.error || "Nao foi possivel validar o codigo informado.");
      setLoadingLookup(false);
      return;
    }

    setResolvedExam(payload.exam);
    setDisciplineInformed(payload.exam.disciplineName);

    if (!hasClassGroupOptions) {
      setClassGroupName(payload.exam.targetClassGroupName ?? "");
    }

    setLoadingLookup(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoadingStart(true);

    if (!resolvedExam) {
      setError("Valide o codigo da prova antes de continuar.");
      setLoadingStart(false);
      return;
    }

    const response = await fetch("/api/public/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicCode: resolvedExam.publicCode,
        studentName,
        classGroupName,
        disciplineInformed
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Nao foi possivel iniciar a prova.");
      setLoadingStart(false);
      return;
    }

    const payload = (await response.json()) as { attemptId: string };
    router.push(`/attempt/${payload.attemptId}`);
  }

  return (
    <div className="space-y-5">
      {!resolvedExam ? (
        <form className="space-y-5" onSubmit={validateCode}>
          <div>
            <label className="field-label">Codigo da prova</label>
            <input
              className="input-base"
              placeholder="Ex.: LOGICA2026"
              required
              value={publicCode}
              onChange={(event) => setPublicCode(event.target.value.toUpperCase())}
            />
          </div>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

          <button className="btn-primary w-full" disabled={loadingLookup} type="submit">
            {loadingLookup ? "Validando..." : "Continuar"}
          </button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          <div className="rounded-[28px] border border-red-100 bg-red-50/80 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Prova validada</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{resolvedExam.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{resolvedExam.description || "Siga para a identificacao e inicio da prova."}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
              Codigo {resolvedExam.publicCode} · {resolvedExam.timeLimitMinutes ? `${resolvedExam.timeLimitMinutes} min` : "sem limite"}
            </p>
            {resolvedExam.instructions ? <p className="mt-3 text-sm text-slate-700">{resolvedExam.instructions}</p> : null}
          </div>

          <div>
            <label className="field-label">Nome completo</label>
            <input
              className="input-base"
              placeholder="Informe seu nome"
              required
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Turma</label>
              {hasClassGroupOptions ? (
                <select className="input-base" required value={classGroupName} onChange={(event) => setClassGroupName(event.target.value)}>
                  {classGroups.map((classGroup) => (
                    <option key={classGroup.id} value={classGroup.name}>
                      {classGroup.name}
                    </option>
                  ))}
                </select>
              ) : resolvedExam.targetClassGroupName ? (
                <input className="input-base" readOnly required value={classGroupName} />
              ) : (
                <input
                  className="input-base"
                  placeholder="Informe sua turma"
                  required
                  value={classGroupName}
                  onChange={(event) => setClassGroupName(event.target.value)}
                />
              )}
              {!hasClassGroupOptions ? (
                <p className="mt-2 text-xs text-slate-500">
                  Nenhuma turma foi carregada do cadastro. Informe a turma manualmente para nao bloquear o acesso.
                </p>
              ) : null}
            </div>

            <div>
              <label className="field-label">Disciplina</label>
              {hasDisciplineOptions ? (
                <select className="input-base" required value={disciplineInformed} onChange={(event) => setDisciplineInformed(event.target.value)}>
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.name}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input-base" readOnly required value={disciplineInformed} />
              )}
              <p className="mt-2 text-xs text-slate-500">Sugestao da prova: {selectedDisciplineName}</p>
            </div>
          </div>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" onClick={() => setResolvedExam(null)} type="button">
              Informar outro codigo
            </button>
            <button className="btn-primary flex-1" disabled={loadingStart} type="submit">
              {loadingStart ? "Iniciando..." : "Iniciar prova"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
