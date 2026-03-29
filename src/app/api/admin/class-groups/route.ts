import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { classGroupSchema } from "@/server/validators/schemas";

export async function GET() {
  await requireAdminSession();

  const classGroups = await prisma.classGroup.findMany({
    include: {
      discipline: true
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(classGroups);
}

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const body = await request.json();
  const parsed = classGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      disciplineId: parsed.data.disciplineId || null
    },
    include: {
      discipline: true
    }
  });

  return NextResponse.json(classGroup, { status: 201 });
}
