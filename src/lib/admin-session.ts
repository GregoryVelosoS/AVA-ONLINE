import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth/guards";

export async function getAdminOrRedirect() {
  try {
    return await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }
}
