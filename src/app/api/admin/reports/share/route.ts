import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = (await request.json()) as { examId?: string; label?: string };

  if (!body.examId) {
    return NextResponse.json({ error: "Selecione uma prova para gerar o link de visualização." }, { status: 400 });
  }

  const share = await prisma.reportShareLink.create({
    data: {
      examId: body.examId,
      token: randomUUID().replace(/-/g, ""),
      label: body.label || null,
      createdBy: session.sub
    }
  });

  return NextResponse.json(share, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  await requireAdminSession();
  const body = (await request.json()) as { id?: string; isActive?: boolean };

  if (!body.id) {
    return NextResponse.json({ error: "Link não informado." }, { status: 400 });
  }

  const updated = await prisma.reportShareLink.update({
    where: { id: body.id },
    data: {
      isActive: body.isActive ?? false
    }
  });

  return NextResponse.json(updated);
}
