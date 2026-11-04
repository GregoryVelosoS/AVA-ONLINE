import { NextRequest, NextResponse } from "next/server";
import { requireReportsSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireReportsSession();
    
    const { id } = await context.params;
    
    const attempt = await prisma.studentAttempt.findUnique({
      where: { id }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Tentativa não encontrada." }, { status: 404 });
    }

    await prisma.studentAttempt.delete({
      where: { id }
    });

    revalidateTag("analytics");
    revalidatePath("/admin/reports");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir tentativa:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao excluir a tentativa.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
