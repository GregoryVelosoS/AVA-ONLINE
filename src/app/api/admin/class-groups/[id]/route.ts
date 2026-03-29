import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { classGroupSchema } from "@/server/validators/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = classGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.update({
    where: { id },
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      disciplineId: parsed.data.disciplineId || null
    },
    include: {
      discipline: true
    }
  });

  return NextResponse.json(classGroup);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;

  try {
    await prisma.classGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a turma. Verifique vínculos com provas ou registros existentes." },
      { status: 409 }
    );
  }
}
