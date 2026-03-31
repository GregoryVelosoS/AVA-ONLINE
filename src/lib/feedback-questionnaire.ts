export const FEEDBACK_QUESTION_KEYS = [
  "GENERAL_DIFFICULTY",
  "DIFFICULT_CONTENTS",
  "COMMON_DIFFICULTY_TYPE",
  "SELF_PERFORMANCE",
  "EXPLANATION_CLARITY",
  "CLASS_PACE",
  "EXERCISE_USEFULNESS",
  "SOLO_CONFIDENCE",
  "HELPFUL_CLASS_FORMATS",
  "NEEDS_REVIEW",
  "TOOL_DIFFICULTIES",
  "FINAL_COMMENT"
] as const;

export type FeedbackQuestionKey = (typeof FEEDBACK_QUESTION_KEYS)[number];
export type FeedbackQuestionType = "LINEAR_SCALE" | "SINGLE_CHOICE" | "MULTI_SELECT" | "OPEN_TEXT";

export type FeedbackQuestionDefinition = {
  key: FeedbackQuestionKey;
  type: FeedbackQuestionType;
  title: string;
  description?: string;
  options?: string[];
  emptyStateMessage?: string;
};

export const feedbackScaleOptions = [
  { value: 1, label: "Muito baixo" },
  { value: 2, label: "Baixo" },
  { value: 3, label: "Médio" },
  { value: 4, label: "Bom" },
  { value: 5, label: "Muito alto" }
];

export const commonDifficultyTypeOptions = [
  "Interpretação do enunciado",
  "Conteúdo conceitual",
  "Aplicação prática",
  "Gestão do tempo",
  "Insegurança na resposta"
];

export const classFormatOptions = [
  "Aula expositiva",
  "Resolução guiada de exercícios",
  "Prática em laboratório",
  "Estudo em grupo",
  "Vídeos e materiais assíncronos"
];

export const needsReviewOptions = [
  "Sim, preciso de reforço imediato",
  "Talvez, em tópicos específicos",
  "Não, me sinto seguro"
];

export const toolDifficultyOptions = [
  "Ambiente/sistema da prova",
  "Editor de código ou texto",
  "Organização do tempo",
  "Leitura de imagens ou arquivos",
  "Nenhuma dificuldade com ferramentas"
];

export function buildFeedbackQuestions(contentOptions: string[]) {
  const normalizedContents = Array.from(new Set(contentOptions.map((item) => item.trim()).filter(Boolean)));

  return [
    {
      key: "GENERAL_DIFFICULTY",
      type: "LINEAR_SCALE",
      title: "Como você percebe a dificuldade geral desta prova?",
      description: "1 = muito fácil, 5 = muito difícil."
    },
    {
      key: "DIFFICULT_CONTENTS",
      type: "MULTI_SELECT",
      title: "Quais conteúdos trouxeram mais dificuldade?",
      description: normalizedContents.length > 0 ? "Selecione todos os tópicos que merecem revisão." : "Esta prova ainda não possui temas cadastrados.",
      options: normalizedContents,
      emptyStateMessage: "Nenhum tema foi vinculado a esta prova. O restante do feedback continua disponível normalmente."
    },
    {
      key: "COMMON_DIFFICULTY_TYPE",
      type: "SINGLE_CHOICE",
      title: "Qual foi o tipo de dificuldade mais comum?",
      options: commonDifficultyTypeOptions
    },
    {
      key: "SELF_PERFORMANCE",
      type: "LINEAR_SCALE",
      title: "Como você percebe o seu próprio desempenho?",
      description: "1 = fui muito mal, 5 = fui muito bem."
    },
    {
      key: "EXPLANATION_CLARITY",
      type: "LINEAR_SCALE",
      title: "As explicações das aulas foram claras para esta avaliação?",
      description: "1 = pouco claras, 5 = muito claras."
    },
    {
      key: "CLASS_PACE",
      type: "LINEAR_SCALE",
      title: "Como você avalia o ritmo das aulas?",
      description: "1 = muito acelerado, 5 = muito adequado."
    },
    {
      key: "EXERCISE_USEFULNESS",
      type: "LINEAR_SCALE",
      title: "Os exercícios ajudaram na preparação?",
      description: "1 = ajudaram pouco, 5 = ajudaram muito."
    },
    {
      key: "SOLO_CONFIDENCE",
      type: "LINEAR_SCALE",
      title: "Quão seguro você se sente para resolver sozinho?",
      description: "1 = nada seguro, 5 = muito seguro."
    },
    {
      key: "HELPFUL_CLASS_FORMATS",
      type: "MULTI_SELECT",
      title: "Quais formatos de aula mais ajudam você?",
      options: classFormatOptions
    },
    {
      key: "NEEDS_REVIEW",
      type: "SINGLE_CHOICE",
      title: "Você sente necessidade de revisão ou reforço?",
      options: needsReviewOptions
    },
    {
      key: "TOOL_DIFFICULTIES",
      type: "MULTI_SELECT",
      title: "Houve dificuldade com ferramentas utilizadas?",
      options: toolDifficultyOptions
    },
    {
      key: "FINAL_COMMENT",
      type: "OPEN_TEXT",
      title: "Comentários finais",
      description: "Compartilhe observações livres, sugestões ou pontos que merecem atenção."
    }
  ] satisfies FeedbackQuestionDefinition[];
}

export function serializeSelections(values: string[]) {
  return JSON.stringify(Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))));
}

export function parseSelections(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
