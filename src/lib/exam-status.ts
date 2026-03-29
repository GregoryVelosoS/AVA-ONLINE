export type ExamStatusValue = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export function normalizePublicCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function getExamAvailabilityMessage(input: {
  status: ExamStatusValue;
  isPublicActive: boolean;
  startAt: Date;
  endAt: Date;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (input.status === "ARCHIVED") {
    return { ok: false, code: "archived", message: "A prova está arquivada." };
  }

  if (input.status === "CLOSED") {
    return { ok: false, code: "closed", message: "A prova foi encerrada." };
  }

  if (input.status === "DRAFT") {
    return { ok: false, code: "draft", message: "A prova ainda não foi publicada." };
  }

  if (!input.isPublicActive) {
    return { ok: false, code: "disabled", message: "A prova está desativada no momento." };
  }

  if (input.startAt > now) {
    return { ok: false, code: "future", message: "A prova ainda não foi liberada." };
  }

  if (input.endAt < now) {
    return { ok: false, code: "expired", message: "A prova expirou e não aceita novas entradas." };
  }

  return { ok: true, code: "ok", message: "Código validado com sucesso." };
}

export function getExamDisplayStatus(status: ExamStatusValue, isPublicActive: boolean) {
  if (status === "PUBLISHED" && isPublicActive) {
    return "Ativa";
  }

  if (status === "PUBLISHED" && !isPublicActive) {
    return "Desativada";
  }

  if (status === "DRAFT") {
    return "Rascunho";
  }

  if (status === "CLOSED") {
    return "Encerrada";
  }

  return "Arquivada";
}
