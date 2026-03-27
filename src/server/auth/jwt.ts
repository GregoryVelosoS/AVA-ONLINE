import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type AdminSession = {
  sub: string;
  email: string;
  role: "ADMIN";
};

export function signAdminToken(payload: AdminSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token?: string): AdminSession | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AdminSession;
  } catch {
    return null;
  }
}
