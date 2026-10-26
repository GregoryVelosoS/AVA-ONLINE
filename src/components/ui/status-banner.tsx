import { extractApiErrorMessage } from "@/lib/api-errors";

export function StatusBanner({
  tone,
  message
}: {
  tone: "error" | "success" | "info";
  message: unknown;
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-red-200 bg-red-100 text-red-800";

  const text = typeof message === "string" ? message : extractApiErrorMessage(message);

  return <p className={`rounded-xl border px-3 py-2.5 text-lg font-medium ${toneClass}`}>{text}</p>;
}
