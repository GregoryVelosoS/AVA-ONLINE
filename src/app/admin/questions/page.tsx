import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/admin-nav";
import { QuestionForm } from "@/components/admin/question-form";
import { QuestionImportPanel } from "@/components/admin/question-import-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionManagementList } from "@/components/admin/question-management-list";

import { getCachedDisciplines } from "@/server/services/lookups";
import { unstable_cache } from "next/cache";

const getCachedQuestionsList = unstable_cache(
  async () => {
    return prisma.question.findMany({
      include: {
        discipline: true,
        options: true
      },
      orderBy: { createdAt: "desc" }
    });
  },
  ["admin-questions-list"],
  { revalidate: 15, tags: ["questions"] }
);

export default async function AdminQuestionsPage() {
  await getAdminOrRedirect();

  const [disciplines, questions] = await Promise.all([
    getCachedDisciplines(),
    getCachedQuestionsList()
  ]);

  const questionList = questions.map((question) => ({
    id: question.id,
    code: question.code,
    type: question.type,
    title: question.title,
    disciplineName: question.discipline.name,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    context: question.context,
    statement: question.statement,
    visualSupportType: question.visualSupportType,
    supportCode: question.supportCode,
    supportImagePath: question.supportImagePath,
    supportImageName: question.supportImageName,
    supportFilePath: question.supportFilePath,
    supportFileName: question.supportFileName,
    status: question.status,
    createdAt: question.createdAt.toISOString(),
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      content: option.content,
      isCorrect: option.isCorrect,
      position: option.position
    }))
  }));

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

      <QuestionManagementList questions={questionList} disciplines={disciplines.map((discipline) => discipline.name)} />
    </main>
  );
}
