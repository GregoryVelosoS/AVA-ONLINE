"use client";

import { useState } from "react";

export function AttemptResultIdCard({ resultLookupCode }: { resultLookupCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(resultLookupCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">ID da tentativa</p>
      <p className="mt-3 break-all text-2xl font-black tracking-tight text-slate-950">{resultLookupCode}</p>
      <p className="mt-3 text-sm text-slate-600">Copie este ID para realizar a consulta do seu desempenho futuramente.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={copyCode} type="button">
          {copied ? "ID copiado" : "Copiar ID"}
        </button>
        {copied ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Copiado com sucesso</span> : null}
      </div>
    </div>
  );
}
