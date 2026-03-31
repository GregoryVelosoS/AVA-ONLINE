import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { StudentIdentifyForm } from "@/components/exam/student-identify-form";
import { getExamAvailabilityMessage } from "@/lib/exam-status";

export default async function PublicExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const link = await prisma.publicExamLink.findUnique({
    where: { slug },
    include: {
      exam: {
        include: {
          discipline: true,
          classGroup: true
        }
      }
    }
  });

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
          Código {link.exam.publicCode} · {link.exam.classGroup.name} · {link.exam.discipline.name}
        </p>
        <StudentIdentifyForm
          initialOrigin="PUBLIC_LINK"
          initialExam={{
            title: link.exam.title,
            publicCode: link.exam.publicCode,
            description: link.exam.description,
            disciplineId: link.exam.disciplineId,
            disciplineName: link.exam.discipline.name,
            targetClassGroupId: link.exam.targetClassGroupId,
            targetClassGroupName: link.exam.classGroup.name,
            timeLimitMinutes: link.exam.timeLimitMinutes,
            instructions: link.exam.instructions
          }}
        />
      </Card>
    </main>
  );
}
