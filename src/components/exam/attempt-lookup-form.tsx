"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";

export function AttemptLookupForm() {
  const router = useRouter();
  const [resultLookupCode, setResultLookupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/public/attempts/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultLookupCode
      })
    });

    const payload = (await response.json()) as { error?: string; attemptId?: string };

    if (!response.ok || !payload.attemptId) {
      setError(payload.error || "Não foi possível localizar a tentativa informada.");
      setLoading(false);
      return;
    }

    router.push(`/submitted/${payload.attemptId}`);
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <label className="field-label">ID da tentativa</label>
        <input className="input-base" placeholder="Ex.: TENT-AB12CD34EF" required value={resultLookupCode} onChange={(event) => setResultLookupCode(event.target.value.toUpperCase())} />
      </div>

      <p className="text-sm text-slate-500">Use o identificador exibido no fim da prova para consultar novamente seu desempenho sem login.</p>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

      <LoadingButton className="w-full" loading={loading} loadingText="Consultando..." type="submit">
        Consultar desempenho
      </LoadingButton>
    </form>
  );
}
