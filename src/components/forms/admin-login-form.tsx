"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ava.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Falha ao autenticar");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="field-label">E-mail</label>
        <input
          className="input-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
      </div>
      <div>
        <label className="field-label">Senha</label>
        <input
          className="input-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
      </div>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
