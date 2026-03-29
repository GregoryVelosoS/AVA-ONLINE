import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { StudentIdentifyForm } from "@/components/exam/student-identify-form";
import { getExamAvailabilityMessage } from "@/lib/exam-status";

export default async function PublicExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [link, disciplines, classGroups] = await Promise.all([
    prisma.publicExamLink.findUnique({
      where: { slug },
      include: {
        exam: {
          include: {
            discipline: true
          }
        }
      }
    }),
    prisma.discipline.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.classGroup.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  if (!link) {
    notFound();
  }

  const availability = getExamAvailabilityMessage({
    status: link.exam.status,
    isPublicActive: link.isActive,
    startAt: link.exam.startAt,
    endAt: link.exam.endAt
  });

  if (!availability.ok) {
    notFound();
  }

  return (
    <main className="container-page">
      <Card title={link.exam.title}>
        <p className="mb-4 text-slate-600">{link.exam.description || "Sem descrição"}</p>
        <p className="mb-3 text-sm text-slate-700">
          <strong>Instruções:</strong> {link.exam.instructions}
        </p>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
          Código {link.exam.publicCode} · {link.exam.timeLimitMinutes ? `${link.exam.timeLimitMinutes} minutos de duração` : "Sem limite de tempo definido"}
        </p>
        <StudentIdentifyForm
          classGroups={classGroups.map((classGroup) => ({ id: classGroup.id, name: classGroup.name }))}
          disciplines={disciplines.map((discipline) => ({
            id: discipline.id,
            name: discipline.name
          }))}
          initialExam={{
            title: link.exam.title,
            publicCode: link.exam.publicCode,
            description: link.exam.description,
            disciplineId: link.exam.disciplineId,
            disciplineName: link.exam.discipline.name,
            timeLimitMinutes: link.exam.timeLimitMinutes,
            instructions: link.exam.instructions
          }}
        />
      </Card>
    </main>
  );
}
