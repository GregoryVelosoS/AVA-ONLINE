import { cookies } from "next/headers";
import { UserRole, verifyAdminToken } from "./jwt";

async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return verifyAdminToken(token);
}

export async function requireAdminSession() {
  const session = await readSession();

  if (!session || session.role !== "ADM") {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireReportsSession() {
  const session = await readSession();

  if (!session || !["ADM", "VISUALIZADOR"].includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireSessionByRole(allowedRoles: UserRole[]) {
  const session = await readSession();

  if (!session || !allowedRoles.includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function getOptionalAdminSession() {
  return readSession();
}
