"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
import { getQuestionSupportAssetUrl } from "@/lib/assets";

type Discipline = {
  id: string;
  name: string;
};

type Theme = {
  id: string;
  name: string;
};

type QuestionType = "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type QuestionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type VisualSupportType = "NONE" | "ASSET" | "CODE";

type OptionState = {
  label: string;
  content: string;
  isCorrect: boolean;
};

type SupportAssetState = {
  path: string;
  name: string;
  mime: string;
};

export type QuestionFormState = {
  id?: string;
  code: string;
  title: string;
  type: QuestionType;
  subject: string;
  topic: string;
  statement: string;
  difficulty: Difficulty;
  disciplineId: string;
  context: string;
  visualSupportType: VisualSupportType;
  supportCode: string;
  expectedFeedback: string;
  answerExplanation: string;
  studyTopics: string;
  studyLinks: string;
  referencePlaylist: string;
  complementaryNotes: string;
  supportImagePath: string;
  supportImageName: string;
  supportImageMime: string;
  supportFilePath: string;
  supportFileName: string;
  supportFileMime: string;
  defaultWeight: number;
  status: QuestionStatus;
  themeIds: string[];
  options: OptionState[];
};

const defaultOptions: OptionState[] = [
  { label: "A", content: "", isCorrect: false },
  { label: "B", content: "", isCorrect: false }
];

function createDefaultState(disciplines: Discipline[]): QuestionFormState {
  return {
    code: "",
    title: "",
    type: "MULTIPLE_CHOICE",
    subject: "",
    topic: "",
    statement: "",
    difficulty: "EASY",
    disciplineId: disciplines[0]?.id ?? "",
    context: "",
    visualSupportType: "NONE",
    supportCode: "",
    expectedFeedback: "",
    answerExplanation: "",
    studyTopics: "",
    studyLinks: "",
    referencePlaylist: "",
    complementaryNotes: "",
    supportImagePath: "",
    supportImageName: "",
    supportImageMime: "",
    supportFilePath: "",
    supportFileName: "",
    supportFileMime: "",
    defaultWeight: 1,
    status: "ACTIVE",
    themeIds: [],
    options: defaultOptions
  };
}

export function QuestionForm({
  disciplines,
  themes = [],
  initialQuestion,
  mode
}: {
  disciplines: Discipline[];
  themes?: Theme[];
  initialQuestion?: QuestionFormState;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form, setForm] = useState<QuestionFormState>(initialQuestion ?? createDefaultState(disciplines));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const imagePreview = useMemo(() => getQuestionSupportAssetUrl(form.supportImagePath), [form.supportImagePath]);

  function updateField<K extends keyof QuestionFormState>(field: K, value: QuestionFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOption(index: number, patch: Partial<OptionState>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option))
    }));
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: [
        ...current.options,
        {
          label: String.fromCharCode(65 + current.options.length),
          content: "",
          isCorrect: false
        }
      ]
    }));
  }

  function removeOption(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({
          ...option,
          label: String.fromCharCode(65 + optionIndex)
        }))
    }));
  }

  function handleVisualSupportTypeChange(value: VisualSupportType) {
    setForm((current) => ({
      ...current,
      visualSupportType: value,
      ...(value === "CODE"
        ? {
            supportImagePath: "",
            supportImageName: "",
            supportImageMime: "",
            supportFilePath: "",
            supportFileName: "",
            supportFileMime: ""
          }
        : {}),
      ...(value === "ASSET"
        ? {
            supportCode: ""
          }
        : {}),
      ...(value === "NONE"
        ? {
            supportCode: "",
            supportImagePath: "",
            supportImageName: "",
            supportImageMime: "",
            supportFilePath: "",
            supportFileName: "",
            supportFileMime: ""
          }
        : {})
    }));
  }

  async function uploadAsset(file: File, kind: "image" | "file") {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);

    const response = await fetch("/api/admin/question-support", {
      method: "POST",
      body
    });

    const payload = (await response.json()) as { error?: string; path?: string; name?: string; mime?: string };
    if (!response.ok || !payload.path || !payload.name || !payload.mime) {
      throw new Error(payload.error || "Falha no upload do apoio visual.");
    }

    return payload as Required<SupportAssetState>;
  }

  async function handleAssetChange(file: File | undefined, kind: "image" | "file") {
    if (!file) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      if (kind === "image") {
        setUploadingImage(true);
      } else {
        setUploadingFile(true);
      }

      const asset = await uploadAsset(file, kind);
      setForm((current) => ({
        ...current,
        visualSupportType: "ASSET",
        ...(kind === "image"
          ? {
              supportImagePath: asset.path,
              supportImageName: asset.name,
              supportImageMime: asset.mime
            }
          : {
              supportFilePath: asset.path,
              supportFileName: asset.name,
              supportFileMime: asset.mime
            })
      }));
      setSuccess(kind === "image" ? "Imagem de apoio enviada." : "Arquivo de apoio enviado.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload.");
    } finally {
      if (kind === "image") {
        setUploadingImage(false);
      } else {
        setUploadingFile(false);
      }
    }
  }

  function clearAsset(kind: "image" | "file") {
    setForm((current) => ({
      ...current,
      ...(kind === "image"
        ? {
            supportImagePath: "",
            supportImageName: "",
            supportImageMime: ""
          }
        : {
            supportFilePath: "",
            supportFileName: "",
            supportFileMime: ""
          })
    }));
  }

  function toggleTheme(themeId: string) {
    setForm((current) => ({
      ...current,
      themeIds: current.themeIds.includes(themeId)
        ? current.themeIds.filter((id) => id !== themeId)
        : [...current.themeIds, themeId]
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      options: form.options.map((option, index) => ({
        ...option,
        position: index + 1
      }))
    };

    const endpoint = mode === "create" ? "/api/admin/questions" : `/api/admin/questions/${form.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as {
      error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      id?: string;
    };

    if (!response.ok) {
      const fieldError =
        typeof data.error === "object"
          ? Object.values(data.error.fieldErrors ?? {}).flat()[0] || data.error.formErrors?.[0]
          : data.error;
      setError(fieldError || "Não foi possível salvar a questão.");
      return;
    }

    if (mode === "create" && data.id) {
      startTransition(() => {
        router.push(`/admin/questions/${data.id}`);
        router.refresh();
      });
      return;
    }

    setSuccess("Questão atualizada com sucesso.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="surface-panel space-y-5 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Configuração base</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Dados da questão</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Código</label>
            <input className="input-base" required value={form.code} onChange={(event) => updateField("code", event.target.value)} />
          </div>
          <div>
            <label className="field-label">Título</label>
            <input className="input-base" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </div>
          <div>
            <label className="field-label">Disciplina</label>
            <select className="input-base" required value={form.disciplineId} onChange={(event) => updateField("disciplineId", event.target.value)}>
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Assunto</label>
            <input className="input-base" required value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
          </div>
          <div>
            <label className="field-label">Tipo</label>
            <select className="input-base" value={form.type} onChange={(event) => updateField("type", event.target.value as QuestionType)}>
              <option value="MULTIPLE_CHOICE">Múltipla escolha</option>
              <option value="SHORT_TEXT">Texto curto</option>
              <option value="LONG_TEXT">Texto longo</option>
              <option value="FILE_UPLOAD">Envio de arquivo</option>
            </select>
          </div>
          <div>
            <label className="field-label">Nível</label>
            <select className="input-base" value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value as Difficulty)}>
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Médio</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>
          <div>
            <label className="field-label">Tópico</label>
            <input className="input-base" value={form.topic} onChange={(event) => updateField("topic", event.target.value)} />
          </div>
          <div>
            <label className="field-label">Peso padrão</label>
            <input
              className="input-base"
              min={1}
              step="0.5"
              type="number"
              value={form.defaultWeight}
              onChange={(event) => updateField("defaultWeight", Number(event.target.value))}
            />
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="input-base" value={form.status} onChange={(event) => updateField("status", event.target.value as QuestionStatus)}>
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativa</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="surface-panel space-y-6 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Estrutura da questão</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Ordem de exibição para admin e aluno</h2>
          <p className="mt-2 text-sm text-slate-600">Contexto, suporte visual, comando da questão, alternativas e nível de confiança.</p>
        </div>

        <div>
          <label className="field-label">1. Contexto</label>
          <textarea
            className="input-base min-h-28"
            placeholder="Apresente o cenário introdutório da questão."
            value={form.context}
            onChange={(event) => updateField("context", event.target.value)}
          />
        </div>

        <section className="space-y-4 rounded-[28px] border border-red-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,245,245,0.98)_100%)] p-5">
          <div>
            <label className="field-label">2. Suporte visual</label>
            <p className="mt-1 text-sm text-slate-600">Escolha se a questão terá material visual por imagem/arquivo ou um bloco de código formatado.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: "NONE", label: "Sem suporte", description: "A questão seguirá apenas com contexto e comando." },
              { value: "ASSET", label: "Imagem ou arquivo", description: "Exiba imagem e/ou arquivo complementar antes do comando." },
              { value: "CODE", label: "Bloco de código", description: "Use uma área monoespaçada para trechos técnicos." }
            ].map((option) => {
              const selected = form.visualSupportType === option.value;

              return (
                <button
                  key={option.value}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition",
                    selected
                      ? "border-red-500 bg-red-50 text-slate-950 ring-4 ring-red-100"
                      : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50"
                  ].join(" ")}
                  onClick={() => handleVisualSupportTypeChange(option.value as VisualSupportType)}
                  type="button"
                >
                  <p className="text-sm font-black text-red-700">{option.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                </button>
              );
            })}
          </div>

          {form.visualSupportType === "CODE" ? (
            <div>
              <label className="field-label">Código de apoio</label>
              <textarea
                className="input-base min-h-64 font-mono text-sm leading-6"
                placeholder={"Exemplo:\nfor (let i = 0; i < lista.length; i++) {\n  console.log(lista[i]);\n}"}
                spellCheck={false}
                value={form.supportCode}
                onChange={(event) => updateField("supportCode", event.target.value)}
              />
            </div>
          ) : null}

          {form.visualSupportType === "ASSET" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Imagem de apoio</h3>
                    <p className="text-sm text-slate-500">PNG, JPG, WEBP ou GIF com até 5 MB.</p>
                  </div>
                  {form.supportImagePath ? (
                    <button className="btn-secondary" onClick={() => clearAsset("image")} type="button">
                      Remover
                    </button>
                  ) : null}
                </div>

                <label className="mt-4 block">
                  <span className="btn-secondary cursor-pointer">{uploadingImage ? "Enviando..." : "Selecionar imagem"}</span>
                  <input
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => handleAssetChange(event.target.files?.[0], "image")}
                    type="file"
                  />
                </label>

                {imagePreview ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <Image alt={form.supportImageName || "Imagem de apoio"} className="h-auto w-full object-cover" height={360} src={imagePreview} unoptimized width={720} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Nenhuma imagem associada.</p>
                )}

                {form.supportImageName ? <p className="mt-3 text-sm font-medium text-slate-700">{form.supportImageName}</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Arquivo complementar</h3>
                    <p className="text-sm text-slate-500">PDF, DOC, DOCX, PPT, PPTX ou TXT com até 10 MB.</p>
                  </div>
                  {form.supportFilePath ? (
                    <button className="btn-secondary" onClick={() => clearAsset("file")} type="button">
                      Remover
                    </button>
                  ) : null}
                </div>

                <label className="mt-4 block">
                  <span className="btn-secondary cursor-pointer">{uploadingFile ? "Enviando..." : "Selecionar arquivo"}</span>
                  <input
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={(event) => handleAssetChange(event.target.files?.[0], "file")}
                    type="file"
                  />
                </label>

                {form.supportFileName ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{form.supportFileName}</p>
                    {form.supportFilePath ? (
                      <a
                        className="mt-2 inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
                        href={getQuestionSupportAssetUrl(form.supportFilePath) || "#"}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Visualizar arquivo
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Nenhum arquivo associado.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <div>
          <label className="field-label">3. Comando da questão</label>
          <textarea
            className="input-base min-h-32"
            placeholder="Escreva o enunciado principal ou a pergunta."
            required
            value={form.statement}
            onChange={(event) => updateField("statement", event.target.value)}
          />
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="field-label">4. Alternativas</label>
              <p className="mt-1 text-sm text-slate-600">
                {form.type === "MULTIPLE_CHOICE"
                  ? "Defina ao menos duas alternativas e marque a correta."
                  : "Questões discursivas e por arquivo não exibem alternativas, mas mantêm o nível de confiança ao final."}
              </p>
            </div>
            {form.type === "MULTIPLE_CHOICE" ? (
              <button className="btn-secondary" onClick={addOption} type="button">
                Adicionar alternativa
              </button>
            ) : null}
          </div>

          {form.type === "MULTIPLE_CHOICE" ? (
            <div className="mt-4 space-y-3">
              {form.options.map((option, index) => (
                <div key={`${option.label}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[80px_1fr_auto_auto]">
                  <input className="input-base" value={option.label} onChange={(event) => updateOption(index, { label: event.target.value })} />
                  <input
                    className="input-base"
                    placeholder="Texto da alternativa"
                    value={option.content}
                    onChange={(event) => updateOption(index, { content: event.target.value })}
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <input checked={option.isCorrect} onChange={(event) => updateOption(index, { isCorrect: event.target.checked })} type="checkbox" />
                    Correta
                  </label>
                  <button className="btn-secondary" onClick={() => removeOption(index)} type="button">
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <StatusBanner
              tone="info"
              message={
                form.type === "FILE_UPLOAD"
                  ? "Esta questão usará envio de arquivo como resposta do aluno. O bloco de confiança continua visível na prova."
                  : "Esta questão será respondida em campo textual pelo aluno e seguirá a mesma ordem visual antes do nível de confiança."
              }
            />
          )}
        </section>
      </div>

      <div className="surface-panel space-y-5 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Feedback pós-prova</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Material de revisão para o aluno</h2>
          <p className="mt-2 text-sm text-slate-600">Esses campos alimentam a tela final com explicação, temas de estudo, links e observações.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Feedback esperado</label>
            <textarea
              className="input-base min-h-28"
              placeholder="Explique o raciocínio esperado ou o principal ponto de atenção."
              value={form.expectedFeedback}
              onChange={(event) => updateField("expectedFeedback", event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Explicação da resposta</label>
            <textarea
              className="input-base min-h-28"
              placeholder="Mostre por que a resposta está correta ou onde ocorreu o erro."
              value={form.answerExplanation}
              onChange={(event) => updateField("answerExplanation", event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Tema(s) para estudo/revisão</label>
            <textarea
              className="input-base min-h-28"
              placeholder={"Um tema por linha\nEx.: Estruturas condicionais\nOperadores lógicos"}
              value={form.studyTopics}
              onChange={(event) => updateField("studyTopics", event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Links de apoio para estudo</label>
            <textarea
              className="input-base min-h-28"
              placeholder={"Um link por linha\nhttps://exemplo.com/material-1\nhttps://exemplo.com/material-2"}
              value={form.studyLinks}
              onChange={(event) => updateField("studyLinks", event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Playlist de vídeos ou URL de referência</label>
            <input
              className="input-base"
              placeholder="https://youtube.com/playlist?list=..."
              value={form.referencePlaylist}
              onChange={(event) => updateField("referencePlaylist", event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Observações complementares</label>
            <textarea
              className="input-base min-h-28"
              placeholder="Anote orientações extras para o feedback final do aluno."
              value={form.complementaryNotes}
              onChange={(event) => updateField("complementaryNotes", event.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      <button className="btn-primary" disabled={isPending} type="submit">
        {isPending ? "Salvando..." : mode === "create" ? "Criar questão" : "Salvar alterações"}
      </button>
    </form>
  );
}
