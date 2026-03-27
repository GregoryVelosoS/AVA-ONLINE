import { cookies } from "next/headers";
import { verifyAdminToken } from "./jwt";

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const session = verifyAdminToken(token);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
