import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  
  const { id } = await context.params;
  const body = await request.json();
  const { status } = body;

  if (!["ACTIVE", "ARCHIVED", "DRAFT"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.question.update({
      where: { id },
      data: { 
        status, 
        archivedAt: status === "ARCHIVED" ? new Date() : null 
      }
    });
    
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status da questão" }, { status: 500 });
  }
}
