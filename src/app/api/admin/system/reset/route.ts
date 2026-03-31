import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { createSystemBackup, wipeDatabase } from "@/server/services/system-backup";
import { systemResetSchema } from "@/server/validators/schemas";

const confirmationPhrase = "RESETAR BANCO";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const body = await request.json();
  const parsed = systemResetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.confirmationText !== confirmationPhrase) {
    return NextResponse.json(
      {
        error: `Digite exatamente "${confirmationPhrase}" para confirmar o reset.`
      },
      { status: 400 }
    );
  }

  const backup = await createSystemBackup({
    initiatedBy: session.sub,
    reason: "pre-reset-admin"
  });

  await wipeDatabase();

  return NextResponse.json({
    backup,
    message: "Base resetada com backup automático concluído."
  });
}
