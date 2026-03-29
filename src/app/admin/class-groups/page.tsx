import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { CatalogManager } from "@/components/admin/catalog-manager";

export default async function AdminClassGroupsPage() {
  await getAdminOrRedirect();

  const [classGroups, disciplines] = await Promise.all([
    prisma.classGroup.findMany({
      include: {
        discipline: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.discipline.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Turmas</h1>
          <p className="section-subtitle">Cadastre, pesquise, edite e exclua as turmas usadas nas provas e na identificação do aluno.</p>
        </div>
        <AdminNav current="/admin/class-groups" />
      </header>

      <CatalogManager
        endpoint="/api/admin/class-groups"
        itemLabel="Turma"
        items={classGroups}
        disciplines={disciplines}
        withDiscipline
      />
    </main>
  );
}
