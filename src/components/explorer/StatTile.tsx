export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 sm:p-4">
      <p className="text-xs text-primary-foreground/85">{label}</p>
      <p className="mt-1 font-sans text-2xl font-semibold text-primary-foreground tabular-nums sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-primary-foreground/85">{sub}</p>}
    </div>
  );
}
