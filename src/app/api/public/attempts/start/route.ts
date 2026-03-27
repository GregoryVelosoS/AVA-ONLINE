import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { startAttemptSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = startAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const link = await prisma.publicExamLink.findUnique({
    where: { slug: parsed.data.slug },
    include: { exam: true }
  });

  if (!link || !link.isActive || link.exam.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Prova indisponível" }, { status: 404 });
  }

  const now = new Date();
  if (link.exam.startAt > now || link.exam.endAt < now) {
    return NextResponse.json({ error: "Fora da janela de aplicação" }, { status: 400 });
  }

  const countAttempts = await prisma.studentAttempt.count({ where: { examId: link.examId } });

  const attempt = await prisma.studentAttempt.create({
    data: {
      examId: link.examId,
      publicLinkId: link.id,
      attemptNumber: countAttempts + 1,
      status: "STARTED",
      profile: {
        create: {
          studentName: parsed.data.studentName,
          classGroupName: parsed.data.classGroupName,
          disciplineInformed: parsed.data.disciplineInformed
        }
      }
    }
  });

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}
