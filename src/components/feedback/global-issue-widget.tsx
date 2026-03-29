"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export function GlobalIssueWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"SUGGESTION" | "BUG" | "QUESTION">("SUGGESTION");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const contextLabel = useMemo(() => {
    if (!pathname) {
      return "Página não identificada";
    }

    if (pathname.startsWith("/attempt/")) {
      return "Fluxo da prova";
    }

    if (pathname.startsWith("/admin")) {
      return "Área administrativa";
    }

    return "Área pública";
  }, [pathname]);

  function resetForm() {
    setType("SUGGESTION");
    setTitle("");
    setDescription("");
    setFile(null);
    setPreviewUrl(null);
  }

  function closeModal() {
    setOpen(false);
    setMessage(null);
  }

  function handleFileChange(nextFile: File | undefined) {
    if (!nextFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);

    const body = new FormData();
    body.append("type", type);
    body.append("title", title);
    body.append("description", description);
    body.append("sourcePath", pathname || "/");
    body.append("sourceUrl", typeof window !== "undefined" ? window.location.href : "");
    body.append("contextLabel", contextLabel);
    if (file) {
      body.append("screenshot", file);
    }

    const response = await fetch("/api/issue-reports", {
      method: "POST",
      body
    });

    const payload = (await response.json()) as { error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] } };
    if (!response.ok) {
      const fieldError =
        typeof payload.error === "object"
          ? Object.values(payload.error.fieldErrors ?? {}).flat()[0] || payload.error.formErrors?.[0]
          : payload.error;
      setMessage(fieldError || "Não foi possível enviar o registro agora.");
      setSubmitting(false);
      return;
    }

    resetForm();
    setMessage("Registro enviado com sucesso.");
    setSubmitting(false);
    window.setTimeout(() => {
      closeModal();
    }, 1200);
  }

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 rounded-full border border-red-500 bg-[linear-gradient(135deg,#c1121f_0%,#7f1019_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_20px_40px_rgba(193,18,31,0.28)] transition hover:translate-y-[-1px]"
        onClick={() => setOpen(true)}
        type="button"
      >
        Sugestões / Reportar problema
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 md:items-center">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Canal rápido</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Sugestões e reporte de problemas</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Conte o que aconteceu, anexe uma imagem se ajudar e o sistema registrará automaticamente a página atual.
                </p>
              </div>
              <button className="btn-secondary" onClick={closeModal} type="button">
                Fechar
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Tipo</label>
                <select className="input-base" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                  <option value="SUGGESTION">Sugestão</option>
                  <option value="BUG">Erro</option>
                  <option value="QUESTION">Dúvida</option>
                </select>
              </div>
              <div>
                <label className="field-label">Contexto detectado</label>
                <input className="input-base" readOnly value={`${contextLabel} · ${pathname || "/"}`} />
              </div>
              <div className="md:col-span-2">
                <label className="field-label">Título resumido</label>
                <input className="input-base" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="field-label">Descrição detalhada</label>
                <textarea className="input-base min-h-40" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="field-label">Imagem opcional</label>
              <label className="mt-2 inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">
                Selecionar imagem
                <input className="hidden" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleFileChange(event.target.files?.[0])} type="file" />
              </label>

              {file ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  {previewUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <Image alt="Preview do anexo" className="h-auto w-full object-cover" height={300} src={previewUrl} unoptimized width={600} />
                    </div>
                  ) : null}
                  <button className="btn-secondary" onClick={() => handleFileChange(undefined)} type="button">
                    Remover imagem
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">PNG, JPG, WEBP ou GIF com até 5 MB.</p>
              )}
            </div>

            {message ? (
              <p className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-medium ${message.includes("sucesso") ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button className="btn-secondary" onClick={closeModal} type="button">
                Cancelar
              </button>
              <button className="btn-primary" disabled={submitting} onClick={submit} type="button">
                {submitting ? "Enviando..." : "Enviar registro"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
