import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { userUpdateSchema } from "@/server/validators/schemas";

async function countActiveAdmins(excludeUserId?: string) {
  return prisma.adminUser.count({
    where: {
      role: "ADM",
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    }
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos para atualização do usuário." }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (parsed.data.email.toLowerCase() !== existing.email.toLowerCase()) {
    const duplicate = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });

    if (duplicate) {
      return NextResponse.json({ error: "Já existe outro usuário com este e-mail." }, { status: 409 });
    }
  }

  if (session.sub === id && (parsed.data.role !== "ADM" || !parsed.data.isActive)) {
    return NextResponse.json({ error: "Você não pode remover seu próprio acesso administrativo." }, { status: 400 });
  }

  if (existing.role === "ADM" && existing.isActive && (parsed.data.role !== "ADM" || !parsed.data.isActive)) {
    const otherActiveAdmins = await countActiveAdmins(id);
    if (otherActiveAdmins === 0) {
      return NextResponse.json({ error: "É necessário manter pelo menos um usuário ADM ativo." }, { status: 400 });
    }
  }

  const passwordHash =
    parsed.data.password && parsed.data.password.trim().length > 0 ? await bcrypt.hash(parsed.data.password, 12) : undefined;

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      ...(passwordHash ? { passwordHash } : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  const { id } = await context.params;

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (session.sub === id) {
    return NextResponse.json({ error: "Você não pode excluir o usuário atualmente autenticado." }, { status: 400 });
  }

  if (existing.role === "ADM" && existing.isActive) {
    const otherActiveAdmins = await countActiveAdmins(id);
    if (otherActiveAdmins === 0) {
      return NextResponse.json({ error: "É necessário manter pelo menos um usuário ADM ativo." }, { status: 400 });
    }
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
