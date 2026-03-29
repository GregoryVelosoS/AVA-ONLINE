import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExamAnalyticsDashboard } from "@/components/admin/exam-analytics-dashboard";
import { ReportActionsPanel } from "@/components/admin/report-actions-panel";
import { getExamAnalytics } from "@/server/services/analytics";

type PageProps = {
  searchParams: Promise<{
    examId?: string;
    classGroupId?: string;
    disciplineId?: string;
    student?: string;
    questionId?: string;
    level?: string;
    tagId?: string;
    performance?: string;
    scoreBand?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  await getAdminOrRedirect();
  const filters = await searchParams;

  const [analytics, disciplines, classGroups] = await Promise.all([
    getExamAnalytics(filters),
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.classGroup.findMany({ orderBy: { name: "asc" } })
  ]);
  const shareLinks = analytics.selectedExam
    ? await prisma.reportShareLink.findMany({
        where: { examId: analytics.selectedExam.id },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Relatórios Consolidados</h1>
          <p className="section-subtitle">Analise resultados finais, feedback pedagógico, rankings, fragilidades e exportações da prova.</p>
        </div>
        <AdminNav current="/admin/reports" />
      </header>

      <section className="surface-panel space-y-5 p-5 md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Filtros analíticos</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Refine a leitura consolidada da prova</h2>
        </div>

        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="GET">
          <div>
            <label className="field-label">Prova</label>
            <select className="input-base" defaultValue={filters.examId || analytics.selectedExam?.id || ""} name="examId">
              {analytics.exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Disciplina</label>
            <select className="input-base" defaultValue={filters.disciplineId || ""} name="disciplineId">
              <option value="">Todas</option>
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Turma</label>
            <select className="input-base" defaultValue={filters.classGroupId || ""} name="classGroupId">
              <option value="">Todas</option>
              {classGroups.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Aluno</label>
            <input className="input-base" defaultValue={filters.student || ""} name="student" placeholder="Buscar por aluno" />
          </div>
          <div>
            <label className="field-label">Questão</label>
            <select className="input-base" defaultValue={filters.questionId || ""} name="questionId">
              <option value="">Todas</option>
              {analytics.filterOptions.questions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Nível</label>
            <select className="input-base" defaultValue={filters.level || ""} name="level">
              <option value="">Todos</option>
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Médio</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>
          <div>
            <label className="field-label">Tag</label>
            <select className="input-base" defaultValue={filters.tagId || ""} name="tagId">
              <option value="">Todas</option>
              {analytics.filterOptions.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Status de desempenho</label>
            <select className="input-base" defaultValue={filters.performance || ""} name="performance">
              <option value="">Todos</option>
              <option value="below-average">Abaixo da média</option>
              <option value="low-performance">Baixo desempenho</option>
              <option value="high-performance">Alto desempenho</option>
            </select>
          </div>
          <div>
            <label className="field-label">Faixa de nota</label>
            <select className="input-base" defaultValue={filters.scoreBand || ""} name="scoreBand">
              <option value="">Todas</option>
              <option value="0-49%">0-49%</option>
              <option value="50-69%">50-69%</option>
              <option value="70-84%">70-84%</option>
              <option value="85-100%">85-100%</option>
            </select>
          </div>
          <div className="flex items-end gap-3 xl:col-span-2">
            <button className="btn-primary" type="submit">
              Aplicar filtros
            </button>
            <a className="btn-secondary" href="/admin/reports">
              Limpar filtros
            </a>
          </div>
        </form>
      </section>

      {analytics.selectedExam ? (
        <ReportActionsPanel
          examId={analytics.selectedExam.id}
          examTitle={analytics.selectedExam.title}
          shareLinks={shareLinks.map((shareLink) => ({
            id: shareLink.id,
            token: shareLink.token,
            isActive: shareLink.isActive,
            createdAt: shareLink.createdAt.toISOString()
          }))}
        />
      ) : null}

      <ExamAnalyticsDashboard analytics={analytics} />
    </main>
  );
}
