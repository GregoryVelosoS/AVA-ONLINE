/**
 * Formats API errors or Zod flatten error objects into a human-readable string.
 * Prevents React Minified Error #31 (rendering raw object in JSX).
 */
export function extractApiErrorMessage(error: unknown, fallback = "Ocorreu um erro ao processar a solicitação."): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (typeof error === "object") {
    // If it's a Zod flatten object with fieldErrors and/or formErrors
    const errObj = error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
      message?: string;
      error?: unknown;
    };

    if (errObj.error && errObj.error !== error) {
      return extractApiErrorMessage(errObj.error, fallback);
    }

    const messages: string[] = [];

    if (Array.isArray(errObj.formErrors) && errObj.formErrors.length > 0) {
      messages.push(...errObj.formErrors);
    }

    if (errObj.fieldErrors && typeof errObj.fieldErrors === "object") {
      const fieldLabels: Record<string, string> = {
        title: "Nome da prova",
        publicCode: "Código público",
        disciplineId: "Disciplina",
        targetClassGroupId: "Turma vinculada",
        timeLimitMinutes: "Duração da prova",
        startAt: "Data de início",
        endAt: "Data de término",
        themeIds: "Temas da prova",
        questionIds: "Questões",
        status: "Status",
        maxAttempts: "Máximo de tentativas",
        code: "Código",
        name: "Nome",
        email: "E-mail",
        password: "Senha"
      };

      for (const [key, errList] of Object.entries(errObj.fieldErrors)) {
        if (Array.isArray(errList) && errList.length > 0) {
          const label = fieldLabels[key] || key;
          messages.push(`${label}: ${errList[0]}`);
        }
      }
    }

    if (messages.length > 0) {
      return messages.join("; ");
    }

    if (typeof errObj.message === "string" && errObj.message.trim()) {
      return errObj.message;
    }
  }

  return fallback;
}
