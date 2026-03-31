"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

type ResolvedExam = {
  title: string;
  publicCode: string;
  description: string | null;
  disciplineId: string;
  disciplineName: string;
  targetClassGroupId: string;
  targetClassGroupName: string;
  timeLimitMinutes?: number | null;
  instructions?: string | null;
};

export function StudentIdentifyForm({
  initialExam,
  initialOrigin = "PUBLIC_HOME"
}: {
  initialExam?: ResolvedExam | null;
  initialOrigin?: string;
}) {
  const router = useRouter();
  const [publicCode, setPublicCode] = useState(initialExam?.publicCode ?? "");
  const [resolvedExam, setResolvedExam] = useState<ResolvedExam | null>(initialExam ?? null);
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);

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
      setError(payload.error || "Não foi possível validar o código informado.");
      setLoadingLookup(false);
      return;
    }

    setResolvedExam(payload.exam);
    setLoadingLookup(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoadingStart(true);

    if (!resolvedExam) {
      setError("Valide o código da prova antes de continuar.");
      setLoadingStart(false);
      return;
    }

    const response = await fetch("/api/public/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicCode: resolvedExam.publicCode,
        studentName,
        attemptOrigin: initialOrigin
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Não foi possível iniciar a prova.");
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
            <label className="field-label">Código da prova</label>
            <input className="input-base" placeholder="Ex.: LOGICA2026" required value={publicCode} onChange={(event) => setPublicCode(event.target.value.toUpperCase())} />
          </div>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

          <LoadingButton className="w-full" loading={loadingLookup} loadingText="Validando..." type="submit">
            Continuar
          </LoadingButton>
        </form>
      ) : (
        <form className="relative space-y-5" onSubmit={submit}>
          <LoadingOverlay active={loadingStart} label="Preparando a tentativa..." />

          <div className="rounded-[28px] border border-red-100 bg-red-50/80 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Prova validada</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{resolvedExam.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{resolvedExam.description || "Siga para a identificação e início da prova."}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
              Código {resolvedExam.publicCode} · {resolvedExam.timeLimitMinutes ? `${resolvedExam.timeLimitMinutes} min` : "sem limite"}
            </p>
            {resolvedExam.instructions ? <p className="mt-3 text-sm text-slate-700">{resolvedExam.instructions}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Turma vinculada</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{resolvedExam.targetClassGroupName}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Disciplina vinculada</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{resolvedExam.disciplineName}</p>
            </div>
          </div>

          <div>
            <label className="field-label">Nome completo</label>
            <input className="input-base" placeholder="Informe seu nome" required value={studentName} onChange={(event) => setStudentName(event.target.value)} />
          </div>

          <p className="text-sm text-slate-500">A turma e a disciplina já estão vinculadas à prova e serão registradas automaticamente na sua tentativa.</p>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <LoadingButton onClick={() => setResolvedExam(null)} type="button" variant="secondary">
              Informar outro código
            </LoadingButton>
            <LoadingButton className="flex-1" loading={loadingStart} loadingText="Iniciando..." type="submit">
              Iniciar prova
            </LoadingButton>
          </div>
        </form>
      )}
    </div>
  );
}
