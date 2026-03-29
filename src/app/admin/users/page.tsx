import { getAdminOrRedirect } from "@/lib/admin-session";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserManagementPanel } from "@/components/admin/user-management-panel";
import { prisma } from "@/server/db/prisma";

export default async function AdminUsersPage() {
  const session = await getAdminOrRedirect();

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  return (
    <main className="container-page space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="section-title">Usuários</h1>
          <p className="section-subtitle">Cadastre e gerencie usuários internos com perfil ADM ou VISUALIZADOR.</p>
        </div>
        <AdminNav current="/admin/users" role={session.role} />
      </header>

      <UserManagementPanel
        currentUserId={session.sub}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null
        }))}
      />
    </main>
  );
}
