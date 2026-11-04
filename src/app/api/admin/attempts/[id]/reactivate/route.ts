import { NextRequest, NextResponse } from "next/server";
import { requireReportsSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, context: RouteContext) {
  try {
    await requireReportsSession();

    const { id } = await context.params;

    const attempt = await prisma.studentAttempt.findUnique({
      where: { id }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
    }

    const updated = await prisma.studentAttempt.update({
      where: { id },
      data: {
        status: "SUBMITTED"
      }
    });

    revalidateTag("analytics");
    revalidatePath("/admin/reports");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao reativar tentativa:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao reativar a tentativa.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
