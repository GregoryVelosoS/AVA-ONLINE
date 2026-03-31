import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { startAttemptSchema } from "@/server/validators/schemas";
import { getExamAvailabilityMessage, normalizePublicCode } from "@/lib/exam-status";
import { generateAttemptLookupCode } from "@/lib/attempt-lookup";

async function createUniqueResultLookupCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const resultLookupCode = generateAttemptLookupCode();
    const existing = await prisma.studentAttempt.findUnique({
      where: { resultLookupCode },
      select: { id: true }
    });

    if (!existing) {
      return resultLookupCode;
    }
  }

  throw new Error("LOOKUP_CODE_GENERATION_FAILED");
}

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
      discipline: true,
      classGroup: true,
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
  const resultLookupCode = await createUniqueResultLookupCode();

  const attempt = await prisma.studentAttempt.create({
    data: {
      examId: exam.id,
      publicLinkId: exam.publicLinks[0].id,
      resultLookupCode,
      attemptNumber: countAttempts + 1,
      status: "STARTED",
      profile: {
        create: {
          studentName: parsed.data.studentName,
          classGroupId: exam.classGroup.id,
          classGroupName: exam.classGroup.name,
          disciplineId: exam.discipline.id,
          disciplineInformed: exam.discipline.name,
          attemptOrigin: parsed.data.attemptOrigin,
          contextValidationNote: null
        }
      }
    }
  });

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}
