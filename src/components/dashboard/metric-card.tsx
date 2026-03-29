export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-panel overflow-hidden p-0">
      <div className="h-1.5 bg-[linear-gradient(90deg,#c1121f_0%,#101010_100%)]" />
      <div className="p-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      </div>
    </div>
  );
}
