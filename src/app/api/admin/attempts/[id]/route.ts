import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { revalidateTag } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  
  const { id } = await context.params;
  
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id }
  });

  if (!attempt) {
    return NextResponse.json({ error: "Tentativa não encontrada." }, { status: 404 });
  }

  try {
    await prisma.studentAttempt.delete({
      where: { id }
    });

    revalidateTag("analytics");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir tentativa:", error);
    return NextResponse.json({ error: "Erro interno ao excluir a tentativa." }, { status: 500 });
  }
}
