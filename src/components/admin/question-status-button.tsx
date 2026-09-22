"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";

export function QuestionStatusButton({
  questionId,
  currentStatus
}: {
  questionId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isArchived = currentStatus === "ARCHIVED";

  async function handleToggleStatus() {
    const newStatus = isArchived ? "ACTIVE" : "ARCHIVED";
    const actionName = isArchived ? "reativar" : "desativar";

    const confirmed = window.confirm(`Deseja realmente ${actionName} esta questão?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/admin/questions/${questionId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      setLoading(false);
      const payload = await response.json().catch(() => ({}));
      window.alert(payload.error || `Não foi possível ${actionName} a questão.`);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <LoadingButton
      loading={loading}
      loadingText={isArchived ? "Reativando..." : "Desativando..."}
      onClick={handleToggleStatus}
      type="button"
      variant="secondary"
    >
      {isArchived ? "Reativar" : "Desativar"}
    </LoadingButton>
  );
}
