import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { AttemptRunner } from "@/components/exam/attempt-runner";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      exam: {
        include: {
          questions: {
            include: {
              question: {
                include: {
                  options: { orderBy: { position: "asc" } }
                }
              }
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

  const questions = attempt.exam.questions.map((eq) => ({
    id: eq.question.id,
    code: eq.question.code,
    context: eq.question.context,
    statement: eq.question.statement,
    type: eq.question.type,
    visualSupportType: eq.question.visualSupportType,
    supportCode: eq.question.supportCode,
    supportImagePath: eq.question.supportImagePath,
    supportImageName: eq.question.supportImageName,
    supportFilePath: eq.question.supportFilePath,
    supportFileName: eq.question.supportFileName,
    options: eq.question.options.map((option) => ({
      id: option.id,
      label: option.label,
      content: option.content
    }))
  }));

  const initialAnswers = attempt.answers.map((answer) => ({
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId ?? undefined,
    shortTextAnswer: answer.shortTextAnswer ?? undefined,
    longTextAnswer: answer.longTextAnswer ?? undefined,
    confidenceLevel: answer.confidenceLevel
  }));

  return (
    <main className="container-page space-y-4">
      <div>
        <h1 className="section-title">Resolução da prova</h1>
        <p className="section-subtitle">Acompanhe o tempo, o progresso e a seleção de respostas com destaque forte durante toda a prova.</p>
      </div>
      <AttemptRunner
        attemptId={attemptId}
        questions={questions}
        initialAnswers={initialAnswers}
        startedAt={attempt.startedAt.toISOString()}
        timeLimitMinutes={attempt.exam.timeLimitMinutes}
      />
    </main>
  );
}
