import Link from "next/link";
import { notFound } from "next/navigation";
import { VisualSupportBlock } from "@/components/questions/visual-support-block";
import { AttemptResultIdCard } from "@/components/exam/attempt-result-id-card";
import { getAttemptResultSummary } from "@/server/services/attempt-result";

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default async function SubmittedPage({
  params,
  searchParams
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ timeout?: string }>;
}) {
  const { attemptId } = await params;
  const { timeout } = await searchParams;
  const result = await getAttemptResultSummary(attemptId);

  if (!result) {
    notFound();
  }

  return (
    <main className="container-page space-y-6 py-8">
      <section className="surface-panel space-y-6 p-6 md:p-8">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-red-700">Prova finalizada</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {timeout ? "Tempo encerrado e prova enviada automaticamente." : "Prova enviada com sucesso."}
          </h1>
          <p className="text-slate-600">
            {result.profile ? `Resultado de ${result.profile.studentName}. ` : ""}
            Seu envio foi registrado e o reenvio indevido continua bloqueado pelo fluxo atual.
          </p>
          <p className="text-sm text-slate-500">
            {result.exam.publicCode} · {result.exam.disciplineName} · {result.exam.classGroupName}
          </p>
        </div>

        <AttemptResultIdCard resultLookupCode={result.resultLookupCode} />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Pontuacao</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {formatScore(result.totalScore)}
              <span className="text-lg text-slate-500"> / {formatScore(result.maxScore)}</span>
            </p>
          </div>
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Acertos</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">{result.correctCount}</p>
          </div>
          <div className="rounded-[24px] border border-red-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Erros</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{result.incorrectCount}</p>
          </div>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Aguardando revisao</p>
            <p className="mt-2 text-3xl font-black text-amber-900">{result.pendingCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          <a className="btn-primary" href={`/api/public/attempts/${attemptId}/export/pdf`}>
            Exportar PDF
          </a>
          <Link className="btn-secondary" href="/">
            Voltar a tela inicial
          </Link>
        </div>
      </section>

      <section className="surface-panel space-y-5 p-6 md:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Resumo de estudos</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">O que revisar a partir desta prova</h2>
        </div>

        {result.consolidatedTopics.length === 0 && result.consolidatedLinks.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">
            Nenhum tema adicional foi consolidado. Se ainda sentir inseguranca, revise os topicos principais da
            disciplina.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Temas para revisar</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.consolidatedTopics.map((topic) => (
                  <span key={topic} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Materiais sugeridos</p>
              <div className="mt-4 space-y-2">
                {result.consolidatedLinks.map((link) => (
                  <a
                    key={link}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-red-700 hover:border-red-200 hover:bg-red-50"
                    href={link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Feedback por questao</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Acertos, erros e orientacoes de estudo</h2>
        </div>

        <div className="space-y-4">
          {result.questionResults.map((question) => {
            const badgeClass =
              question.resultStatus === "correct"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : question.resultStatus === "incorrect"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : question.resultStatus === "pending"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-700";

            const badgeLabel =
              question.resultStatus === "correct"
                ? "Acertou"
                : question.resultStatus === "incorrect"
                  ? "Errou"
                  : question.resultStatus === "pending"
                    ? "Aguardando correcao"
                    : "Nao respondida";

            return (
              <article key={question.id} className="surface-panel space-y-5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                      Questao {question.position} · {question.code}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{question.statement}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${badgeClass}`}>{badgeLabel}</span>
                </div>

                {question.context ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Contexto</p>
                    <p className="mt-2 whitespace-pre-line text-slate-700">{question.context}</p>
                  </div>
                ) : null}

                <VisualSupportBlock
                  visualSupportType={question.visualSupportType}
                  supportCode={question.supportCode}
                  supportImageName={question.supportImageName}
                  supportImagePath={question.supportImagePath}
                  supportFileName={question.supportFileName}
                  supportFilePath={question.supportFilePath}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Sua resposta</p>
                    {question.type === "MULTIPLE_CHOICE" ? (
                      <p className="mt-2 text-slate-700">
                        {question.selectedOptionLabel
                          ? `${question.selectedOptionLabel}) ${question.selectedOptionContent}`
                          : "Questao nao respondida."}
                      </p>
                    ) : question.shortTextAnswer || question.longTextAnswer ? (
                      <p className="mt-2 whitespace-pre-line text-slate-700">
                        {question.shortTextAnswer || question.longTextAnswer}
                      </p>
                    ) : (
                      <p className="mt-2 text-slate-700">Questao nao respondida ou aguardando upload.</p>
                    )}
                    {question.confidenceLevel ? (
                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Nivel de confianca marcado: {question.confidenceLevel}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Referencia correta</p>
                    <p className="mt-2 text-slate-700">
                      {question.correctOptionLabel
                        ? `${question.correctOptionLabel}) ${question.correctOptionContent}`
                        : "Esta questao depende de correcao textual/manual."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Feedback esperado</p>
                    <p className="mt-2 whitespace-pre-line text-slate-700">{question.expectedFeedback || "Sem feedback cadastrado."}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Explicacao da resposta</p>
                    <p className="mt-2 whitespace-pre-line text-slate-700">
                      {question.answerExplanation || "Sem explicacao cadastrada."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Tema(s) para revisao</p>
                    {question.studyTopics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.studyTopics.map((topic) => (
                          <span key={topic} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-slate-700">Nenhum tema especifico foi cadastrado.</p>
                    )}
                    {question.complementaryNotes ? (
                      <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{question.complementaryNotes}</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Materiais de apoio</p>
                    {question.referenceLinks.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {question.referenceLinks.map((link) => (
                          <a
                            key={link}
                            className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-red-700 hover:border-red-200 hover:bg-red-50"
                            href={link}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-slate-700">Nenhum material adicional foi cadastrado.</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
