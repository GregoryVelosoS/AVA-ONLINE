import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  const body = (await request.json()) as { action?: "activate" | "deactivate" | "close" | "archive" };

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { publicLinks: true }
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  const next =
    body.action === "activate"
      ? { status: "PUBLISHED" as const, isActive: true }
      : body.action === "deactivate"
        ? { status: exam.status, isActive: false }
        : body.action === "close"
          ? { status: "CLOSED" as const, isActive: false }
          : { status: "ARCHIVED" as const, isActive: false };

  const updated = await prisma.exam.update({
    where: { id },
    data: {
      status: next.status,
      publicLinks: exam.publicLinks[0]
        ? {
            updateMany: {
              where: {},
              data: {
                isActive: next.isActive
              }
            }
          }
        : undefined
    },
    include: {
      publicLinks: true
    }
  });

  return NextResponse.json(updated);
}
