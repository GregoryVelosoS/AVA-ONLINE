"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildFeedbackQuestions,
  feedbackScaleOptions,
  type FeedbackQuestionKey
} from "@/lib/feedback-questionnaire";

type FormState = {
  generalDifficulty: number | null;
  difficultContents: string[];
  commonDifficultyType: string;
  selfPerformance: number | null;
  explanationClarity: number | null;
  classPace: number | null;
  exerciseUsefulness: number | null;
  soloConfidence: number | null;
  helpfulClassFormats: string[];
  needsReview: string;
  toolDifficulties: string[];
  finalComment: string;
};

const initialState: FormState = {
  generalDifficulty: null,
  difficultContents: [],
  commonDifficultyType: "",
  selfPerformance: null,
  explanationClarity: null,
  classPace: null,
  exerciseUsefulness: null,
  soloConfidence: null,
  helpfulClassFormats: [],
  needsReview: "",
  toolDifficulties: [],
  finalComment: ""
};

const keyMap: Record<FeedbackQuestionKey, keyof FormState> = {
  GENERAL_DIFFICULTY: "generalDifficulty",
  DIFFICULT_CONTENTS: "difficultContents",
  COMMON_DIFFICULTY_TYPE: "commonDifficultyType",
  SELF_PERFORMANCE: "selfPerformance",
  EXPLANATION_CLARITY: "explanationClarity",
  CLASS_PACE: "classPace",
  EXERCISE_USEFULNESS: "exerciseUsefulness",
  SOLO_CONFIDENCE: "soloConfidence",
  HELPFUL_CLASS_FORMATS: "helpfulClassFormats",
  NEEDS_REVIEW: "needsReview",
  TOOL_DIFFICULTIES: "toolDifficulties",
  FINAL_COMMENT: "finalComment"
};

export function FeedbackForm({
  attemptId,
  contentOptions,
  examTitle
}: {
  attemptId: string;
  contentOptions: string[];
  examTitle: string;
}) {
  const router = useRouter();
  const questions = useMemo(() => buildFeedbackQuestions(contentOptions), [contentOptions]);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleMultiSelect(field: "difficultContents" | "helpfulClassFormats" | "toolDifficulties", option: string) {
    setForm((current) => {
      const selected = current[field];
      const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
      return { ...current, [field]: next };
    });
  }

  function getClientValidationMessage() {
    if (form.generalDifficulty == null) return "Avalie a dificuldade geral da prova.";
    if (contentOptions.length > 0 && form.difficultContents.length === 0) return "Selecione ao menos um conteúdo com maior dificuldade.";
    if (!form.commonDifficultyType) return "Selecione o tipo de dificuldade mais comum.";
    if (form.selfPerformance == null) return "Avalie a sua percepção de desempenho.";
    if (form.explanationClarity == null) return "Avalie a clareza das explicações.";
    if (form.classPace == null) return "Avalie o ritmo das aulas.";
    if (form.exerciseUsefulness == null) return "Avalie a utilidade dos exercícios.";
    if (form.soloConfidence == null) return "Avalie sua segurança para resolver sozinho.";
    if (form.helpfulClassFormats.length === 0) return "Selecione ao menos um formato de aula que mais ajuda.";
    if (!form.needsReview) return "Informe sua necessidade de revisão ou reforço.";
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const validationMessage = getClientValidationMessage();
    if (validationMessage) {
      setError(validationMessage);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/public/attempts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        generalDifficulty: form.generalDifficulty,
        difficultContents: form.difficultContents,
        commonDifficultyType: form.commonDifficultyType,
        selfPerformance: form.selfPerformance,
        explanationClarity: form.explanationClarity,
        classPace: form.classPace,
        exerciseUsefulness: form.exerciseUsefulness,
        soloConfidence: form.soloConfidence,
        helpfulClassFormats: form.helpfulClassFormats,
        needsReview: form.needsReview,
        toolDifficulties: form.toolDifficulties,
        finalComment: form.finalComment
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] } };
      const fieldError =
        typeof payload.error === "object"
          ? Object.values(payload.error.fieldErrors ?? {}).flat()[0] || payload.error.formErrors?.[0]
          : payload.error;
      setError(fieldError || "Não foi possível concluir a prova.");
      setLoading(false);
      return;
    }

    router.push(`/submitted/${attemptId}`);
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <section className="surface-panel space-y-4 p-5 md:p-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Fechamento pedagógico</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{examTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Suas respostas ajudam a analisar a prova, entender a percepção da turma e orientar retomadas de conteúdo.
          </p>
        </div>
      </section>

      {questions.map((question, index) => {
        const field = keyMap[question.key];
        const currentValue = form[field];

        return (
          <section key={question.key} className="surface-panel space-y-4 p-5 md:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Pergunta {index + 1}</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{question.title}</h3>
              {question.description ? <p className="mt-2 text-sm text-slate-600">{question.description}</p> : null}
            </div>

            {question.type === "LINEAR_SCALE" ? (
              <div className="grid gap-3 md:grid-cols-5">
                {feedbackScaleOptions.map((option) => {
                  const selected = currentValue === option.value;

                  return (
                    <button
                      key={option.value}
                      className={[
                        "rounded-2xl border px-4 py-4 text-left transition",
                        selected
                          ? "border-black bg-[linear-gradient(135deg,#101010_0%,#2a0e12_100%)] text-white ring-4 ring-red-100"
                          : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                      ].join(" ")}
                      onClick={() => setField(field, option.value as FormState[typeof field])}
                      type="button"
                    >
                      <p className={`text-lg font-black ${selected ? "text-red-300" : "text-red-700"}`}>{option.value}</p>
                      <p className="mt-1 text-sm font-semibold">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {question.type === "SINGLE_CHOICE" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {question.options?.map((option) => {
                  const selected = currentValue === option;

                  return (
                    <button
                      key={option}
                      className={[
                        "rounded-2xl border px-4 py-4 text-left transition",
                        selected
                          ? "border-red-500 bg-red-50 text-slate-950 ring-4 ring-red-100"
                          : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                      ].join(" ")}
                      onClick={() => setField(field, option as FormState[typeof field])}
                      type="button"
                    >
                      <p className="text-sm font-semibold">{option}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {question.type === "MULTI_SELECT" ? (
              question.options && question.options.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {question.options.map((option) => {
                    const selected = Array.isArray(currentValue) && currentValue.includes(option);

                    return (
                      <button
                        key={option}
                        className={[
                          "rounded-2xl border px-4 py-4 text-left transition",
                          selected
                            ? "border-red-500 bg-red-50 text-slate-950 ring-4 ring-red-100"
                            : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                        ].join(" ")}
                        onClick={() =>
                          toggleMultiSelect(
                            field as "difficultContents" | "helpfulClassFormats" | "toolDifficulties",
                            option
                          )
                        }
                        type="button"
                      >
                        <p className="text-sm font-semibold">{option}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {question.emptyStateMessage || "Nenhuma opção disponível."}
                </p>
              )
            ) : null}

            {question.type === "OPEN_TEXT" ? (
              <textarea
                className="input-base min-h-36"
                placeholder="Escreva aqui seus comentários, sugestões ou observações finais."
                value={String(currentValue)}
                onChange={(event) => setField(field, event.target.value as FormState[typeof field])}
              />
            ) : null}
          </section>
        );
      })}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}

      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Enviando..." : "Enviar feedback pedagógico e ver análise final"}
      </button>
    </form>
  );
}
