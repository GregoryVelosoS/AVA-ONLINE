import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { themeSchema } from "@/server/validators/schemas";

export async function GET() {
  await requireAdminSession();

  const themes = await prisma.theme.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json(themes);
}

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const body = await request.json();
  const parsed = themeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const theme = await prisma.theme.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null
    }
  });

  return NextResponse.json(theme, { status: 201 });
}
