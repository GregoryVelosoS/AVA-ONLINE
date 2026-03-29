import { notFound } from "next/navigation";
import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExamEditor } from "@/components/admin/exam-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminExamDetailPage({ params }: PageProps) {
  await getAdminOrRedirect();

  const { id } = await params;

  const [exam, disciplines, classGroups, questions] = await Promise.all([
    prisma.exam.findUnique({
      where: { id },
      include: {
        publicLinks: true,
        questions: {
          include: {
            question: {
              select: {
                id: true,
                code: true,
                statement: true,
                type: true,
                difficulty: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { position: "asc" }
        }
      }
    }),
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.classGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findMany({
      select: {
        id: true,
        code: true,
        statement: true,
        type: true,
        difficulty: true,
        discipline: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Editar prova</h1>
          <p className="section-subtitle">Ajuste dados principais, duração e monte a sequência de questões da avaliação.</p>
        </div>
        <AdminNav current="/admin/exams" />
      </header>

      <ExamEditor
        exam={{
          id: exam.id,
          title: exam.title,
          publicCode: exam.publicCode,
          description: exam.description,
          disciplineId: exam.disciplineId,
          targetClassGroupId: exam.targetClassGroupId,
          instructions: exam.instructions,
          startAt: exam.startAt.toISOString(),
          endAt: exam.endAt.toISOString(),
          timeLimitMinutes: exam.timeLimitMinutes,
          status: exam.status,
          maxAttempts: exam.maxAttempts,
          publicLinks: exam.publicLinks.map((publicLink) => ({
            slug: publicLink.slug,
            isActive: publicLink.isActive
          })),
          questions: exam.questions.map((item) => ({
            questionId: item.questionId,
            position: item.position,
            question: item.question
          }))
        }}
        disciplines={disciplines}
        classGroups={classGroups}
        availableQuestions={questions}
      />
    </main>
  );
}
