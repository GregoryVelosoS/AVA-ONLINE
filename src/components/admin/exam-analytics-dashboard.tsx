"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { ExamAnalyticsResult } from "@/server/services/analytics";

const pieColors = ["#c1121f", "#101010", "#e5e7eb", "#fca5a5"];

function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-panel p-5 md:p-6">
      <div>
        <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

export function ExamAnalyticsDashboard({ analytics }: { analytics: ExamAnalyticsResult }) {
  if (!analytics.selectedExam || !analytics.summary) {
    return (
      <section className="surface-panel p-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Sem dados</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Nenhuma prova disponível para análise</h2>
        <p className="mt-2 text-slate-600">Cadastre ou publique uma prova para visualizar o dashboard analítico.</p>
      </section>
    );
  }

  const topQuestionChart = analytics.questionPerformance.slice(0, 8).map((question) => ({
    code: question.code,
    acerto: question.accuracy,
    erro: question.errorRate
  }));

  const topStudentsChart = analytics.topStudents.map((student) => ({
    aluno: student.studentName.split(" ")[0],
    nota: student.scorePercent
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Respondentes" value={String(analytics.summary.totalRespondents)} />
        <MetricCard label="Concluíram" value={String(analytics.summary.completedStudents)} />
        <MetricCard label="Média da prova" value={`${analytics.summary.averageScorePercent}%`} />
        <MetricCard label="Taxa de acerto" value={`${analytics.summary.accuracyRate}%`} />
        <MetricCard label="Tempo médio" value={`${analytics.summary.averageDurationMinutes} min`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel p-5">
          <p className="text-sm font-bold text-slate-500">Maior nota</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.summary.highestScore}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm font-bold text-slate-500">Menor nota</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.summary.lowestScore}</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm font-bold text-slate-500">Taxa de conclusão</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.summary.completionRate}%</p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm font-bold text-slate-500">Feedbacks recebidos</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.feedbackAnalytics.responseCount}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Distribuição das notas" subtitle="Faixas de desempenho da prova">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Bar dataKey="value" fill="#c1121f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status de conclusão" subtitle="Concluíram x em andamento">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.completionBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                {analytics.completionBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Questões mais críticas" subtitle="Percentual de acerto e erro por questão">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topQuestionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="code" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Bar dataKey="acerto" stackId="a" fill="#111111" radius={[6, 6, 0, 0]} />
              <Bar dataKey="erro" stackId="a" fill="#c1121f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ranking dos alunos" subtitle="Melhores percentuais de nota">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStudentsChart} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#475569" />
              <YAxis dataKey="aluno" type="category" width={90} stroke="#475569" />
              <Tooltip />
              <Bar dataKey="nota" fill="#c1121f" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid w-full gap-2">
        <ChartCard title="Percepção da turma" subtitle="Médias das respostas em escala">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.feedbackAnalytics.scaleAverages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#475569" interval={0} angle={-12} textAnchor="end" height={70} />
              <YAxis domain={[0, 5]} stroke="#475569" />
              <Tooltip />
              <Bar dataKey="average" fill="#111111" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conteúdos frágeis" subtitle="Temas mais citados ou com maior fragilidade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.pedagogicalInsights.difficultyByTheme}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="topic" stroke="#475569" interval={0} angle={-12} textAnchor="end" height={70} />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Bar dataKey="count" fill="#c1121f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="surface-panel p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Questão mais crítica</p>
          {analytics.questionHighlights?.criticalQuestion ? (
            <>
              <p className="mt-2 text-lg font-black text-slate-950">{analytics.questionHighlights.criticalQuestion.code}</p>
              <p className="mt-2 text-sm text-slate-600">{analytics.questionHighlights.criticalQuestion.statement}</p>
              <p className="mt-3 text-sm font-semibold text-red-700">
                {analytics.questionHighlights.criticalQuestion.errorRate}% de erro
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Sem dados suficientes.</p>
          )}
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Correlação percepção x desempenho</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.feedbackAnalytics.perceptionCorrelation}</p>
          <p className="mt-2 text-sm text-slate-600">
            Quanto mais próximo de 1, maior a coerência entre autopercepção do aluno e resultado real.
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Alunos abaixo da média</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{analytics.pedagogicalInsights.belowAverageCount}</p>
          <p className="mt-2 text-sm text-slate-600">
            {analytics.pedagogicalInsights.lowPerformanceCount} com baixo desempenho crítico (abaixo de 50%).
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="surface-panel overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-black tracking-tight text-slate-950">Ranking de alunos</h3>
            <p className="mt-1 text-sm text-slate-500">Pesquisa por aluno e filtro aplicados refletem nesta tabela.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black text-left text-white">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Nota %</th>
                  <th className="px-4 py-3">Acertos</th>
                  <th className="px-4 py-3">Erros</th>
                  <th className="px-4 py-3">Tempo</th>
                  <th className="px-4 py-3 text-right">Acao</th>
                </tr>
              </thead>
              <tbody>
                {analytics.studentRanking.map((student) => (
                  <tr key={student.attemptId} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-950">{student.studentName}</td>
                    <td className="px-4 py-3">{student.scorePercent}%</td>
                    <td className="px-4 py-3">{student.correctCount}</td>
                    <td className="px-4 py-3">{student.incorrectCount}</td>
                    <td className="px-4 py-3">{student.durationMinutes} min</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                        href={`/submitted/${student.attemptId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Consultar tentativa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-panel overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-black tracking-tight text-slate-950">Desempenho por questão</h3>
            <p className="mt-1 text-sm text-slate-500">Ranking das questões mais erradas e mais acertadas.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[linear-gradient(90deg,#101010_0%,#2a0e12_100%)] text-left text-white">
                <tr>
                  <th className="px-4 py-3">Questão</th>
                  <th className="px-4 py-3">Nível</th>
                  <th className="px-4 py-3">Acerto</th>
                  <th className="px-4 py-3">Erro</th>
                </tr>
              </thead>
              <tbody>
                {analytics.questionPerformance.map((question) => (
                  <tr key={question.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{question.code}</p>
                      <p className="text-xs text-slate-500">{question.statement}</p>
                    </td>
                    <td className="px-4 py-3">{question.difficulty}</td>
                    <td className="px-4 py-3">{question.accuracy}%</td>
                    <td className="px-4 py-3">{question.errorRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="surface-panel p-5">
          <h3 className="text-lg font-black tracking-tight text-slate-950">Top alunos</h3>
          <div className="mt-4 space-y-3">
            {analytics.topStudents.map((student) => (
              <div key={student.attemptId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">{student.studentName}</p>
                <p className="mt-1 text-sm text-slate-600">{student.scorePercent}% · {student.correctCount} acertos</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5">
          <h3 className="text-lg font-black tracking-tight text-slate-950">Mais dificuldade</h3>
          <div className="mt-4 space-y-3">
            {analytics.strugglingStudents.map((student) => (
              <div key={student.attemptId} className="rounded-2xl border border-red-100 bg-red-50/70 p-3">
                <p className="font-semibold text-slate-950">{student.studentName}</p>
                <p className="mt-1 text-sm text-slate-600">{student.scorePercent}% · {student.incorrectCount} erros</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5">
          <h3 className="text-lg font-black tracking-tight text-slate-950">Pontos de retomada</h3>
          <div className="mt-4 space-y-3">
            {analytics.pedagogicalInsights.retomadaPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="surface-panel p-5">
          <h3 className="text-lg font-black tracking-tight text-slate-950">Feedback da turma</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {analytics.feedbackAnalytics.needReviewCounts.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-red-700">{item.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Comentários abertos</h4>
            {analytics.feedbackAnalytics.openComments.length > 0 ? (
              analytics.feedbackAnalytics.openComments.map((comment) => (
                <div key={`${comment.studentName}-${comment.comment}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">{comment.studentName}</p>
                  <p className="mt-2 text-sm text-slate-700">{comment.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhum comentário aberto registrado até o momento.</p>
            )}
          </div>
        </div>

        {analytics.studentDetail ? (
          <div className="surface-panel p-5">
            <h3 className="text-lg font-black tracking-tight text-slate-950">Visão detalhada do aluno</h3>
            <p className="mt-2 text-sm text-slate-500">{analytics.studentDetail.studentName}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Nota</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{analytics.studentDetail.scorePercent}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-500">Tempo gasto</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{analytics.studentDetail.durationMinutes} min</p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Temas com mais dificuldade</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {analytics.studentDetail.weakTopics.map((topic) => (
                  <span key={topic} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Materiais sugeridos</h4>
              <div className="mt-3 space-y-2">
                {analytics.studentDetail.suggestedMaterials.map((material) => (
                  <a key={material} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-red-700" href={material} rel="noreferrer" target="_blank">
                    {material}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-panel p-5">
            <h3 className="text-lg font-black tracking-tight text-slate-950">Visão detalhada do aluno</h3>
            <p className="mt-3 text-sm text-slate-600">Use o filtro de aluno para abrir a análise individual com nota, erros, temas frágeis e feedback final.</p>
          </div>
        )}
      </section>
    </div>
  );
}
