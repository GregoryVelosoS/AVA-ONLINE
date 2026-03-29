import { prisma } from "@/server/db/prisma";
import { StudentIdentifyForm } from "@/components/exam/student-identify-form";

export default async function HomePage() {
  const [disciplines, classGroups] = await Promise.all([
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.classGroup.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <main className="container-page flex min-h-screen items-center">
      <section className="grid w-full ">
        {/* Não necessário */}
        {/* <div className="surface-dark p-8 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-300">AVA Online</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Digite o código da prova e avance com uma entrada rápida e objetiva.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
            O acesso público agora começa pelo código da prova. Depois da validação, o sistema libera sua identificação e o início da avaliação.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Fluxo</p>
              <p className="mt-2 text-3xl font-black">2 etapas</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Turmas</p>
              <p className="mt-2 text-3xl font-black">{classGroups.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Disciplinas</p>
              <p className="mt-2 text-3xl font-black">{disciplines.length}</p>
            </div>
          </div>
        </div> */}

        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">Área do aluno</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Acesso por código</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Informe primeiro o código público da prova. Se ele estiver ativo e válido, a etapa de identificação será liberada logo abaixo.
            </p>
          </div>

          <StudentIdentifyForm
            classGroups={classGroups.map((classGroup) => ({ id: classGroup.id, name: classGroup.name }))}
            disciplines={disciplines.map((discipline) => ({ id: discipline.id, name: discipline.name }))}
          />
        </div>
      </section>
    </main>
  );
}
