import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/exam/feedback-form";
import { prisma } from "@/server/db/prisma";

export default async function FeedbackPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      profile: true,
      exam: {
        include: {
          themes: {
            include: {
              theme: true
            }
          }
        }
      }
    }
  });

  if (!attempt) {
    notFound();
  }

  const contentOptions = attempt.exam.themes.map((item) => item.theme.name);

  return (
    <main className="container-page space-y-4">
      <div>
        <h1 className="section-title">Feedback pedagógico final</h1>
        <p className="section-subtitle">
          {attempt.profile ? `${attempt.profile.studentName}, ` : ""}
          responda rapidamente para gerar indicadores pedagógicos da turma e liberar sua análise final da prova.
        </p>
      </div>
      <FeedbackForm attemptId={attemptId} contentOptions={contentOptions} examTitle={attempt.exam.title} />
    </main>
  );
}
