"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";

type Theme = {
  id: string;
  name: string;
};

export function QuestionThemePanel({
  questionId,
  themes,
  initialThemeIds
}: {
  questionId: string;
  themes: Theme[];
  initialThemeIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [themeIds, setThemeIds] = useState(initialThemeIds);
  const [message, setMessage] = useState<string | null>(null);

  function toggleTheme(themeId: string) {
    setThemeIds((current) => (current.includes(themeId) ? current.filter((id) => id !== themeId) : [...current, themeId]));
  }

  async function saveThemes() {
    setMessage(null);

    const response = await fetch(`/api/admin/questions/${questionId}/themes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeIds })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível salvar os temas da questão.");
      return;
    }

    setMessage("Temas da questão atualizados com sucesso.");
    startTransition(() => router.refresh());
  }

  return (
    <section className="surface-panel space-y-4 p-5 md:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Temas da questão</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Vincular conteúdos analíticos</h2>
        <p className="mt-2 text-sm text-slate-600">Esses temas complementam os campos livres de revisão e ajudam a cruzar desempenho por conteúdo.</p>
      </div>

      {themes.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum tema cadastrado. Cadastre primeiro em Temas.</p>
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

      {message ? <StatusBanner tone={message.includes("sucesso") ? "success" : "error"} message={message} /> : null}

      <button className="btn-primary" disabled={isPending} onClick={saveThemes} type="button">
        {isPending ? "Salvando..." : "Salvar temas da questão"}
      </button>
    </section>
  );
}
