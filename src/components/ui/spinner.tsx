type SpinnerProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]"
};

export function Spinner({ className = "", label = "Carregando", size = "md" }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} role="status">
      <span className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses[size]}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
