"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";

export function QuestionDeleteButton({
  questionId,
  redirectTo
}: {
  questionId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Deseja realmente excluir esta questão?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/admin/questions/${questionId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setLoading(false);
      const payload = (await response.json()) as { error?: string };
      window.alert(payload.error || "Não foi possível excluir a questão.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo as Route);
    } else {
      router.refresh();
    }
  }

  return (
    <button className="btn-danger" disabled={loading} onClick={handleDelete} type="button">
      {loading ? "Excluindo..." : "Excluir questão"}
    </button>
  );
}
