import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { startAttemptSchema } from "@/server/validators/schemas";
import { getExamAvailabilityMessage, normalizePublicCode } from "@/lib/exam-status";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = startAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const publicCode = normalizePublicCode(parsed.data.publicCode);
  const exam = await prisma.exam.findUnique({
    where: { publicCode },
    include: {
      publicLinks: true
    }
  });

  if (!exam || !exam.publicLinks[0]) {
    return NextResponse.json({ error: "Prova indisponível" }, { status: 404 });
  }

  const availability = getExamAvailabilityMessage({
    status: exam.status,
    isPublicActive: exam.publicLinks[0].isActive,
    startAt: exam.startAt,
    endAt: exam.endAt
  });

  if (!availability.ok) {
    return NextResponse.json({ error: availability.message }, { status: 409 });
  }

  const countAttempts = await prisma.studentAttempt.count({ where: { examId: exam.id } });

  const attempt = await prisma.studentAttempt.create({
    data: {
      examId: exam.id,
      publicLinkId: exam.publicLinks[0].id,
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
