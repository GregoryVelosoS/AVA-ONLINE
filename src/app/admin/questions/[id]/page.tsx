import { notFound } from "next/navigation";
import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { QuestionForm, type QuestionFormState } from "@/components/admin/question-form";
import { QuestionDeleteButton } from "@/components/admin/question-delete-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminQuestionDetailPage({ params }: PageProps) {
  await getAdminOrRedirect();

  const { id } = await params;

  const [question, disciplines] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { position: "asc" }
        }
      }
    }),
    prisma.discipline.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!question) {
    notFound();
  }

  const initialQuestion: QuestionFormState = {
    id: question.id,
    code: question.code,
    title: question.title ?? "",
    type: question.type,
    subject: question.subject,
    topic: question.topic ?? "",
    statement: question.statement,
    difficulty: question.difficulty,
    disciplineId: question.disciplineId,
    context: question.context ?? "",
    visualSupportType: question.visualSupportType,
    supportCode: question.supportCode ?? "",
    expectedFeedback: question.expectedFeedback ?? "",
    answerExplanation: question.answerExplanation ?? "",
    studyTopics: question.studyTopics ?? "",
    studyLinks: question.studyLinks ?? "",
    referencePlaylist: question.referencePlaylist ?? "",
    complementaryNotes: question.complementaryNotes ?? "",
    supportImagePath: question.supportImagePath ?? "",
    supportImageName: question.supportImageName ?? "",
    supportImageMime: question.supportImageMime ?? "",
    supportFilePath: question.supportFilePath ?? "",
    supportFileName: question.supportFileName ?? "",
    supportFileMime: question.supportFileMime ?? "",
    defaultWeight: Number(question.defaultWeight),
    status: question.status,
    options: question.options.map((option) => ({
      label: option.label,
      content: option.content,
      isCorrect: option.isCorrect
    }))
  };

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Editar questão</h1>
          <p className="section-subtitle">Ajuste manualmente os dados, o apoio visual e o conteúdo da questão.</p>
        </div>
        <AdminNav current="/admin/questions" />
      </header>

      <div className="flex justify-end">
        <QuestionDeleteButton questionId={question.id} redirectTo="/admin/questions" />
      </div>

      <QuestionForm disciplines={disciplines} initialQuestion={initialQuestion} mode="edit" />
    </main>
  );
}
