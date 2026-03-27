"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackForm({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [openComment, setOpenComment] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    await fetch("/api/public/attempts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        clarityScore: 4,
        difficultyScore: 3,
        timeAdequacyScore: 4,
        contentAlignmentScore: 4,
        selfAssessmentScore: 3,
        confusingQuestionFlag: false,
        openComment
      })
    });

    router.push(`/submitted/${attemptId}`);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <p className="text-sm text-slate-600">Feedback pedagógico pós-prova.</p>
      <textarea className="min-h-32 w-full rounded border px-3 py-2" placeholder="Comentário opcional" value={openComment} onChange={(e) => setOpenComment(e.target.value)} />
      <button className="rounded bg-emerald-600 px-4 py-2 text-white" type="submit">Enviar avaliação</button>
    </form>
  );
}
