import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function PageLoadingState({
  description = "Preparando dados, gráficos e ações da tela.",
  title = "Carregando tela"
}: {
  description?: string;
  title?: string;
}) {
  return (
    <main className="container-page space-y-6">
      <section className="surface-panel p-5 md:p-6">
        <div className="flex items-center gap-3">
          <Spinner className="text-red-700" size="lg" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Aguarde</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
      </section>

      <section className="surface-panel space-y-4 p-5 md:p-6">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </section>
    </main>
  );
}
