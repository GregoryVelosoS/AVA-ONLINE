import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { getRealtimeMonitoring } from "@/server/services/monitoring";

export async function GET(request: NextRequest) {
  await requireAdminSession();
  const examId = request.nextUrl.searchParams.get("examId") || undefined;
  const data = await getRealtimeMonitoring(examId);
  return NextResponse.json(data);
}
