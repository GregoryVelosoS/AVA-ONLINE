import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { AttemptRunner } from "@/components/exam/attempt-runner";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: {
              question: {
                include: { options: { orderBy: { position: "asc" } } }
              }
            },
            orderBy: { position: "asc" }
          }
        }
      }
    }
  });

  if (!attempt) notFound();

  const questions = attempt.exam.questions.map((eq) => ({
    id: eq.question.id,
    code: eq.question.code,
    statement: eq.question.statement,
    type: eq.question.type,
    options: eq.question.options.map((o) => ({ id: o.id, label: o.label, content: o.content }))
  }));

  return (
    <main className="container-page">
      <h1 className="mb-4 text-2xl font-bold">Resolução da prova</h1>
      <AttemptRunner attemptId={attemptId} questions={questions} />
    </main>
  );
}
