import { StudentIdentifyForm } from "@/components/exam/student-identify-form";
import { AttemptLookupForm } from "@/components/exam/attempt-lookup-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <main className="container-page flex min-h-screen items-center py-8">
      <section className="grid w-full gap-6 lg:grid-cols-2">
        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">Fluxo A</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Realizar prova com código</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Informe o código da prova. Depois da validação, o sistema mostra os dados da prova e libera apenas sua identificação pessoal.
            </p>
          </div>

          <StudentIdentifyForm />
        </div>

        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">Fluxo B</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Consultar tentativa anterior</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cole o ID da tentativa gerado no final da prova para abrir novamente sua página de desempenho.
            </p>
          </div>

          <AttemptLookupForm />
        </div>
      </section>
    </main>
  );
}
