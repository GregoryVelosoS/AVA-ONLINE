import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { disciplineSchema } from "@/server/validators/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = disciplineSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const discipline = await prisma.discipline.update({
    where: { id },
    data: {
      code: parsed.data.code,
      name: parsed.data.name
    }
  });

  return NextResponse.json(discipline);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;

  try {
    await prisma.discipline.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a disciplina. Verifique vínculos com provas, questões ou turmas." },
      { status: 409 }
    );
  }
}
