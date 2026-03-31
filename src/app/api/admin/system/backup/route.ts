import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { createSystemBackup } from "@/server/services/system-backup";

export async function POST() {
  const session = await requireAdminSession();
  const backup = await createSystemBackup({
    initiatedBy: session.sub,
    reason: "manual-admin-backup"
  });

  return NextResponse.json(backup, { status: 201 });
}
