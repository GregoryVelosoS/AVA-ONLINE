import { getAdminOrRedirect } from "@/lib/admin-session";

export default async function Page() {
  await getAdminOrRedirect();
  return (
    <main className="container-page space-y-2">
      <h1 className="text-2xl font-bold capitalize">corrections</h1>
      <p className="text-slate-600">Módulo pronto para expansão nesta base inicial (MVP estruturado).</p>
    </main>
  );
}
