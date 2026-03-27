import { getAdminOrRedirect } from "@/lib/admin-session";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminQuestionsPage() {
  await getAdminOrRedirect();
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: { discipline: true }
  });

  return (
    <main className="container-page space-y-4">
      <h1 className="text-2xl font-bold">Banco de Questões</h1>
      <Card>
        <p className="mb-4 text-sm text-slate-500">Cadastre novas questões via API <code>/api/admin/questions</code>.</p>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Código</th>
                <th>Tipo</th>
                <th>Disciplina</th>
                <th>Nível</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b">
                  <td className="py-2 font-medium">{q.code}</td>
                  <td>{q.type}</td>
                  <td>{q.discipline.name}</td>
                  <td>{q.difficulty}</td>
                  <td>{q.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
