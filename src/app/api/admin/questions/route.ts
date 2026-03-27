import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { questionSchema } from "@/server/validators/schemas";

export async function GET() {
  await requireAdminSession();
  const data = await prisma.question.findMany({ include: { options: true, tags: { include: { tag: true } } } });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.type === "MULTIPLE_CHOICE") {
    const options = parsed.data.options ?? [];
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (options.length < 2 || correctCount === 0) {
      return NextResponse.json({ error: "Questão objetiva exige >=2 opções e 1 correta" }, { status: 400 });
    }
  }

  const created = await prisma.question.create({
    data: {
      code: parsed.data.code,
      type: parsed.data.type,
      statement: parsed.data.statement,
      subject: parsed.data.subject,
      difficulty: parsed.data.difficulty,
      disciplineId: parsed.data.disciplineId,
      createdBy: session.sub,
      status: "ACTIVE",
      options: parsed.data.options ? { create: parsed.data.options } : undefined
    }
  });

  return NextResponse.json(created, { status: 201 });
}
