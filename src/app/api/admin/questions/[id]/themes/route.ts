import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const questionThemesSchema = z.object({
  themeIds: z.array(z.string().uuid()).default([])
});

export async function POST(request: NextRequest, context: RouteContext) {
  await requireAdminSession();

  const { id } = await context.params;
  const body = await request.json();
  const parsed = questionThemesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!question) {
    return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });
  }

  const uniqueThemeIds = Array.from(new Set(parsed.data.themeIds));

  if (uniqueThemeIds.length > 0) {
    const themeCount = await prisma.theme.count({
      where: {
        id: {
          in: uniqueThemeIds
        }
      }
    });

    if (themeCount !== uniqueThemeIds.length) {
      return NextResponse.json({ error: "Um ou mais temas selecionados não foram encontrados." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.questionTheme.deleteMany({
      where: { questionId: id }
    });

    if (uniqueThemeIds.length > 0) {
      await tx.questionTheme.createMany({
        data: uniqueThemeIds.map((themeId) => ({
          questionId: id,
          themeId
        }))
      });
    }
  });

  return NextResponse.json({ ok: true });
}
