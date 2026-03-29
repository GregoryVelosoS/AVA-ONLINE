import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { issueReportStatusSchema } from "@/server/validators/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  const body = await request.json();
  const parsed = issueReportStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.issueReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      internalNotes: parsed.data.internalNotes || null
    }
  });

  return NextResponse.json(updated);
}
