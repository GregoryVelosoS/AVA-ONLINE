import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminExamsPage() {
  await getAdminOrRedirect();
  const exams = await prisma.exam.findMany({
    include: { publicLinks: true, discipline: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="container-page space-y-4">
      <h1 className="text-2xl font-bold">Lista de Provas</h1>
      <Card>
        <p className="mb-4 text-sm text-slate-500">Cadastre provas via API <code>/api/admin/exams</code>.</p>
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li key={exam.id} className="rounded border p-3">
              <p className="font-semibold">{exam.title}</p>
              <p className="text-sm text-slate-500">{exam.discipline.name} · {exam.status}</p>
              <p className="text-sm">Link público: /exam/{exam.publicLinks[0]?.slug || "sem-link"}</p>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
