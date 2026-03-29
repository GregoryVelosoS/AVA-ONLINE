import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { examLookupSchema } from "@/server/validators/schemas";
import { getExamAvailabilityMessage, normalizePublicCode } from "@/lib/exam-status";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = examLookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um código de prova válido." }, { status: 400 });
  }

  const publicCode = normalizePublicCode(parsed.data.publicCode);
  const exam = await prisma.exam.findUnique({
    where: { publicCode },
    include: {
      discipline: true,
      publicLinks: true
    }
  });

  if (!exam) {
    return NextResponse.json({ error: "Código inválido ou prova inexistente." }, { status: 404 });
  }

  const availability = getExamAvailabilityMessage({
    status: exam.status,
    isPublicActive: exam.publicLinks[0]?.isActive ?? false,
    startAt: exam.startAt,
    endAt: exam.endAt
  });

  if (!availability.ok) {
    return NextResponse.json({ error: availability.message, reason: availability.code }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    exam: {
      id: exam.id,
      title: exam.title,
      publicCode: exam.publicCode,
      disciplineId: exam.disciplineId,
      disciplineName: exam.discipline.name,
      timeLimitMinutes: exam.timeLimitMinutes,
      description: exam.description,
      instructions: exam.instructions
    }
  });
}
