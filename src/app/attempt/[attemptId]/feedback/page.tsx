import { FeedbackForm } from "@/components/exam/feedback-form";

export default async function FeedbackPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  return (
    <main className="container-page">
      <h1 className="mb-4 text-2xl font-bold">Feedback final</h1>
      <FeedbackForm attemptId={attemptId} />
    </main>
  );
}
