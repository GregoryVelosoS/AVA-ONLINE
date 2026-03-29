import { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="surface-panel p-5 md:p-6">
      {title ? <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-950">{title}</h2> : null}
      {children}
    </section>
  );
}
