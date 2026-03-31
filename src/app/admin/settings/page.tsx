import { AdminNav } from "@/components/admin/admin-nav";
import { SystemMaintenancePanel } from "@/components/admin/system-maintenance-panel";
import { getAdminOrRedirect } from "@/lib/admin-session";
import { listRecentBackups } from "@/server/services/system-backup";

export default async function Page() {
  await getAdminOrRedirect();
  const backups = await listRecentBackups();

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Configurações</h1>
          <p className="section-subtitle">Painel operacional para manutenção segura, backup local e reset protegido da base.</p>
        </div>

        <AdminNav current="/admin/settings" role="ADM" />
      </header>

      <SystemMaintenancePanel backups={backups} />
    </main>
  );
}
