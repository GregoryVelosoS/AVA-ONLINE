import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { IssueReportBoard } from "@/components/admin/issue-report-board";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function AdminIssuesPage({ searchParams }: PageProps) {
  await getAdminOrRedirect();
  const filters = await searchParams;

  const reports = await prisma.issueReport.findMany({
    where: {
      ...(filters.type ? { type: filters.type as "SUGGESTION" | "BUG" | "QUESTION" } : {}),
      ...(filters.status ? { status: filters.status as "NEW" | "IN_REVIEW" | "RESOLVED" | "ARCHIVED" } : {}),
      ...(filters.page
        ? {
            sourcePath: {
              contains: filters.page
            }
          }
        : {})
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Sugestões e Reportes</h1>
          <p className="section-subtitle">Visualize, filtre e acompanhe os registros enviados a partir de qualquer página do sistema.</p>
        </div>
        <AdminNav current="/admin/issues" role="ADM" />
      </header>

      <section className="surface-panel space-y-4 p-5">
        <form className="grid gap-4 md:grid-cols-[200px_220px_1fr_auto_auto]" method="GET">
          <select className="input-base" defaultValue={filters.type || ""} name="type">
            <option value="">Todos os tipos</option>
            <option value="SUGGESTION">Sugestão</option>
            <option value="BUG">Erro</option>
            <option value="QUESTION">Dúvida</option>
          </select>
          <select className="input-base" defaultValue={filters.status || ""} name="status">
            <option value="">Todos os status</option>
            <option value="NEW">Novo</option>
            <option value="IN_REVIEW">Em análise</option>
            <option value="RESOLVED">Resolvido</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
          <input className="input-base" defaultValue={filters.page || ""} name="page" placeholder="Filtrar por página/rota" />
          <button className="btn-primary" type="submit">
            Filtrar
          </button>
          <a className="btn-secondary" href="/admin/issues">
            Limpar
          </a>
        </form>
      </section>

      <IssueReportBoard
        reports={reports.map((report) => ({
          id: report.id,
          type: report.type,
          status: report.status,
          title: report.title,
          description: report.description,
          sourcePath: report.sourcePath,
          contextLabel: report.contextLabel,
          screenshotPath: report.screenshotPath,
          screenshotName: report.screenshotName,
          createdAt: report.createdAt.toISOString(),
          internalNotes: report.internalNotes
        }))}
      />
    </main>
  );
}
