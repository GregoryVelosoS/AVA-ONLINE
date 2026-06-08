import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, context: RouteContext) {
  await requireAdminSession();

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
      status: "CANCELED"
    }
  });

  return NextResponse.json(updated);
}
