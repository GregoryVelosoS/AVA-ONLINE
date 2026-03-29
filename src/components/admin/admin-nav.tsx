"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/exams", label: "Provas" },
  { href: "/admin/questions", label: "Questões" },
  { href: "/admin/disciplines", label: "Disciplinas" },
  { href: "/admin/class-groups", label: "Turmas" },
  { href: "/admin/monitoring", label: "Monitoramento" },
  { href: "/admin/reports", label: "Relatórios" },
  { href: "/admin/issues", label: "Sugestões" }
];

export function AdminNav({ current }: { current?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="surface-dark p-3 md:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map((link) => {
            const active = current === link.href;

            return (
              <Link
                key={link.href}
                href={link.href as Route}
                className={[
                  "rounded-xl border px-3 py-2 transition",
                  active
                    ? "border-red-400 bg-[linear-gradient(135deg,#c1121f_0%,#8b0c16_100%)] text-white shadow-[0_12px_24px_rgba(193,18,31,0.3)]"
                    : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button className="btn-danger self-start border-red-400/40 bg-white text-red-700 hover:bg-red-50" disabled={loading} onClick={logout} type="button">
          {loading ? "Saindo..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
