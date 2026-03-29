import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { disciplineSchema } from "@/server/validators/schemas";

export async function GET() {
  await requireAdminSession();

  const disciplines = await prisma.discipline.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json(disciplines);
}

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const body = await request.json();
  const parsed = disciplineSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const discipline = await prisma.discipline.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name
    }
  });

  return NextResponse.json(discipline, { status: 201 });
}
