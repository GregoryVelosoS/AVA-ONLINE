"use client";

import { FormEvent, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    const payload = (await response.json()) as {
      error?: string;
      redirectTo?: "/admin/dashboard" | "/admin/reports";
    };

    if (!response.ok) {
      setError(payload.error || "Falha ao autenticar");
      setLoading(false);
      return;
    }

    router.push((payload.redirectTo || "/admin/dashboard") as Route);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="field-label">E-mail</label>
        <input className="input-base" value={email} placeholder="Digite seu email" onChange={(e) => setEmail(e.target.value)} type="email" required />
      </div>

      <div>
        <label className="field-label">Senha</label>
        <input className="input-base" value={password} placeholder="Digite sua senha" onChange={(e) => setPassword(e.target.value)} type="password" required />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

      <LoadingButton className="w-full" loading={loading} loadingText="Entrando..." type="submit">
        Entrar
      </LoadingButton>
    </form>
  );
}
