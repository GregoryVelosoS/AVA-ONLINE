export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-red-200 bg-[linear-gradient(180deg,#fff_0%,#fff5f5_100%)] px-4 py-10 text-center">
      <p className="text-base font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
