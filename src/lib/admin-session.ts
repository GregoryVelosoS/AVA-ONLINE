import { redirect } from "next/navigation";
import { getOptionalAdminSession, requireAdminSession, requireReportsSession } from "@/server/auth/guards";

export async function getAdminOrRedirect() {
  try {
    return await requireAdminSession();
  } catch {
    const session = await getOptionalAdminSession();
    redirect(session?.role === "VISUALIZADOR" ? "/admin/reports" : "/admin/login");
  }
}

export async function getReportsUserOrRedirect() {
  try {
    return await requireReportsSession();
  } catch {
    redirect("/admin/login");
  }
}
