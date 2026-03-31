import { Spinner } from "@/components/ui/spinner";

type LoadingOverlayProps = {
  active: boolean;
  className?: string;
  label?: string;
};

export function LoadingOverlay({
  active,
  className = "",
  label = "Processando..."
}: LoadingOverlayProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/78 backdrop-blur-[1px] ${className}`.trim()}
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
        <Spinner className="text-red-700" size="sm" />
        <span>{label}</span>
      </div>
    </div>
  );
}
