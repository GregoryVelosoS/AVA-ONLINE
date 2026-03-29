import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/exam/feedback-form";
import { prisma } from "@/server/db/prisma";
import { getQuestionStudyTopics } from "@/lib/question-feedback";

export default async function FeedbackPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      profile: true,
      exam: {
        include: {
          questions: {
            include: {
              question: true
            },
            orderBy: { position: "asc" }
          }
        }
      }
    }
  });

  if (!attempt) {
    notFound();
  }

  const contentOptions = Array.from(
    new Set(
      attempt.exam.questions.flatMap((examQuestion) =>
        getQuestionStudyTopics({
          studyTopics: examQuestion.question.studyTopics,
          subject: examQuestion.question.subject,
          topic: examQuestion.question.topic
        })
      )
    )
  );

  return (
    <main className="container-page space-y-4">
      <div>
        <h1 className="section-title">Feedback pedagógico final</h1>
        <p className="section-subtitle">
          {attempt.profile ? `${attempt.profile.studentName}, ` : ""}
          responda rapidamente para gerar indicadores pedagógicos da turma e liberar sua análise final da prova.
        </p>
      </div>
      <FeedbackForm
        attemptId={attemptId}
        contentOptions={contentOptions}
        examTitle={attempt.exam.title}
      />
    </main>
  );
}
