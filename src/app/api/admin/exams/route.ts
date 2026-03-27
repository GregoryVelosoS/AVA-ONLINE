import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { examSchema } from "@/server/validators/schemas";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  await requireAdminSession();
  const data = await prisma.exam.findMany({ include: { questions: true, publicLinks: true } });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.exam.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      disciplineId: parsed.data.disciplineId,
      instructions: parsed.data.instructions,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      status: parsed.data.status,
      maxAttempts: parsed.data.maxAttempts,
      createdBy: session.sub,
      questions: {
        create: parsed.data.questionIds.map((questionId, index) => ({
          questionId,
          position: index + 1
        }))
      },
      publicLinks: {
        create: {
          slug: `${slugify(parsed.data.title)}-${Date.now()}`,
          isActive: parsed.data.status === "PUBLISHED"
        }
      }
    }
  });

  return NextResponse.json(created, { status: 201 });
}
