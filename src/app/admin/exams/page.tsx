import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExamCreateForm } from "@/components/admin/exam-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ExamManagementList } from "@/components/admin/exam-management-list";

export default async function AdminExamsPage() {
  await getAdminOrRedirect();

  const [disciplines, exams] = await Promise.all([
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.exam.findMany({
      include: {
        discipline: true,
        publicLinks: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Provas</h1>
          <p className="section-subtitle">Gerencie o ciclo de vida completo das provas com código público, ativação, desativação e exclusão.</p>
        </div>
        <AdminNav current="/admin/exams" role="ADM" />
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card title="Nova prova">
          {disciplines.length === 0 ? (
            <EmptyState title="Cadastre uma disciplina antes" description="A prova precisa estar vinculada a uma disciplina antes de ser criada." />
          ) : (
            <ExamCreateForm disciplines={disciplines} />
          )}
        </Card>

        <Card title="Provas cadastradas">
          {exams.length === 0 ? (
            <EmptyState title="Nenhuma prova cadastrada" description="Crie a primeira prova para começar a organizar o ciclo de aplicação." />
          ) : (
            <ExamManagementList
              exams={exams.map((exam) => ({
                id: exam.id,
                title: exam.title,
                publicCode: exam.publicCode,
                disciplineName: exam.discipline.name,
                timeLimitMinutes: exam.timeLimitMinutes,
                status: exam.status,
                isPublicActive: exam.publicLinks[0]?.isActive ?? false
              }))}
            />
          )}
        </Card>
      </section>
    </main>
  );
}
