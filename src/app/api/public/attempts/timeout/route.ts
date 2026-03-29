import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { finalizeAttempt, isAttemptTimeExpired, timeoutFeedbackDefaults } from "@/server/services/attempts";
import { z } from "zod";

const timeoutSchema = z.object({
  attemptId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = timeoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Tentativa inválida." }, { status: 400 });
  }

  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: parsed.data.attemptId },
    include: {
      exam: true
    }
  });

  if (!attempt) {
    return NextResponse.json({ error: "Tentativa não encontrada." }, { status: 404 });
  }

  if (attempt.status === "SUBMITTED") {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  if (!isAttemptTimeExpired(attempt)) {
    return NextResponse.json({ error: "O tempo da prova ainda não se esgotou." }, { status: 400 });
  }

  await finalizeAttempt(parsed.data.attemptId, timeoutFeedbackDefaults);
  return NextResponse.json({ ok: true });
}
