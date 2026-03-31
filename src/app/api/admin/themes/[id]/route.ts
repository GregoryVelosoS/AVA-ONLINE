import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { themeSchema } from "@/server/validators/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const body = await request.json();
  const parsed = themeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const theme = await prisma.theme.update({
    where: { id },
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null
    }
  });

  return NextResponse.json(theme);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;

  try {
    await prisma.theme.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir o tema. Verifique vínculos com provas ou questões." },
      { status: 409 }
    );
  }
}
