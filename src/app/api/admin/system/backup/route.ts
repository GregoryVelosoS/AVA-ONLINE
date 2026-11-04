import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { createSystemBackup } from "@/server/services/system-backup";

export async function POST() {
  try {
    const session = await requireAdminSession();
    const backup = await createSystemBackup({
      initiatedBy: session.sub,
      reason: "manual-admin-backup"
    });

    return NextResponse.json(backup, { status: 201 });
  } catch (error) {
    console.error("Backup creation error:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar backup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
