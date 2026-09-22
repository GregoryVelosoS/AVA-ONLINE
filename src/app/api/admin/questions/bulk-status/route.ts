import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";

export async function PATCH(request: NextRequest) {
  await requireAdminSession();
  
  const body = await request.json();
  const { ids, status } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Nenhuma questão selecionada" }, { status: 400 });
  }

  if (!["ACTIVE", "ARCHIVED", "DRAFT"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.question.updateMany({
      where: { id: { in: ids } },
      data: { 
        status, 
        archivedAt: status === "ARCHIVED" ? new Date() : null 
      }
    });
    
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status das questões" }, { status: 500 });
  }
}
