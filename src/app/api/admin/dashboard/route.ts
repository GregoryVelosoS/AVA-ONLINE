import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { getDashboardOverview } from "@/server/services/analytics";

export async function GET() {
  await requireAdminSession();
  const overview = await getDashboardOverview();
  return NextResponse.json(overview);
}
