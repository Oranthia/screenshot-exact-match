export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/70">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-primary-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-primary-foreground/70">{sub}</p>}
    </div>
  );
}
