import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { CatalogManager } from "@/components/admin/catalog-manager";

export default async function AdminDisciplinesPage() {
  await getAdminOrRedirect();

  const disciplines = await prisma.discipline.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Disciplinas</h1>
          <p className="section-subtitle">Cadastre, pesquise, edite e exclua as disciplinas usadas nas provas e questões.</p>
        </div>
        <AdminNav current="/admin/disciplines" />
      </header>

      <CatalogManager endpoint="/api/admin/disciplines" itemLabel="Disciplina" items={disciplines} />
    </main>
  );
}
