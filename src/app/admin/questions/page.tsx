import Link from "next/link";
import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/admin-nav";
import { QuestionForm } from "@/components/admin/question-form";
import { QuestionImportPanel } from "@/components/admin/question-import-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionDeleteButton } from "@/components/admin/question-delete-button";

export default async function AdminQuestionsPage() {
  await getAdminOrRedirect();

  const [disciplines, questions] = await Promise.all([
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findMany({
      include: {
        discipline: true,
        options: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Banco de Questões</h1>
          <p className="section-subtitle">Criação manual, edição individual e importação em lote com modelo padrão.</p>
        </div>
        <AdminNav current="/admin/questions" role="ADM" />
      </header>

      {disciplines.length === 0 ? (
        <EmptyState
          title="Cadastre ao menos uma disciplina"
          description="As questões precisam estar vinculadas a uma disciplina antes de serem criadas."
        />
      ) : (
      <section className="grid gap-6">
          <Card title="Nova questão">
            <QuestionForm disciplines={disciplines} mode="create" />
          </Card>

          <Card title="Importação com modelo padrão">
            <QuestionImportPanel disciplines={disciplines} />
          </Card>
        </section>
      )}

      <Card title="Questões cadastradas">
        {questions.length === 0 ? (
          <EmptyState title="Nenhuma questão cadastrada" description="Use o formulário acima ou importe um lote inicial de questões." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-left text-white">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Disciplina</th>
                  <th className="px-4 py-3">Nível</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{question.code}</td>
                    <td className="px-4 py-3">{question.type}</td>
                    <td className="px-4 py-3">{question.discipline.name}</td>
                    <td className="px-4 py-3">{question.difficulty}</td>
                    <td className="px-4 py-3">{question.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href={`/admin/questions/${question.id}`}>
                          Editar
                        </Link>
                        <QuestionDeleteButton questionId={question.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
