import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/card";
import { StudentIdentifyForm } from "@/components/exam/student-identify-form";

export default async function PublicExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const link = await prisma.publicExamLink.findUnique({
    where: { slug },
    include: { exam: true }
  });

  if (!link || !link.isActive || link.exam.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <main className="container-page">
      <Card title={link.exam.title}>
        <p className="mb-4 text-slate-600">{link.exam.description || "Sem descrição"}</p>
        <p className="mb-2 text-sm"><strong>Instruções:</strong> {link.exam.instructions}</p>
        <StudentIdentifyForm slug={slug} />
      </Card>
    </main>
  );
}
