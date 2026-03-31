import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { CatalogManager } from "@/components/admin/catalog-manager";

export default async function AdminThemesPage() {
  await getAdminOrRedirect();

  const themes = await prisma.theme.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Temas</h1>
          <p className="section-subtitle">Cadastre os conteúdos usados nas provas, no feedback final e na análise posterior.</p>
        </div>
        <AdminNav current="/admin/themes" role="ADM" />
      </header>

      <CatalogManager endpoint="/api/admin/themes" itemLabel="Tema" items={themes} withDescription />
    </main>
  );
}
