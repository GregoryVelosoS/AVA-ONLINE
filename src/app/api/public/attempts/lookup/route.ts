import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { normalizeAttemptLookupCode } from "@/lib/attempt-lookup";
import { attemptLookupSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = attemptLookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um ID de tentativa válido." }, { status: 400 });
  }

  const resultLookupCode = normalizeAttemptLookupCode(parsed.data.resultLookupCode);
  const attempt = await prisma.studentAttempt.findUnique({
    where: { resultLookupCode },
    select: {
      id: true,
      status: true
    }
  });

  if (!attempt) {
    return NextResponse.json({ error: "Tentativa não encontrada." }, { status: 404 });
  }

  if (attempt.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Tentativa indisponível para visualização no momento." }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    attemptId: attempt.id
  });
}
