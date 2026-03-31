import { randomBytes } from "crypto";

const LOOKUP_PREFIX = "TENT";

export function normalizeAttemptLookupCode(value: string) {
  return value.trim().toUpperCase();
}

export function generateAttemptLookupCode() {
  const token = randomBytes(5).toString("hex").toUpperCase();
  return `${LOOKUP_PREFIX}-${token}`;
}
