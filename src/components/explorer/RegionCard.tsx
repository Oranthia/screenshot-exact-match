import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { RegionProgress } from "@/lib/progress";
import { ProgressBar, formatPercent } from "./ProgressBar";
import { cn } from "@/lib/utils";

export function RegionCard({ name, slug, progress }: { name: string; slug: string; progress: RegionProgress }) {
  const empty = progress.total === 0;
  return (
    <Link
      to="/regione/$slug"
      params={{ slug }}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift",
        progress.completed && "border-gold",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-semibold leading-tight">{name}</h3>
        {progress.completed ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-gold-foreground"><Check className="h-3.5 w-3.5" /></span>
        ) : progress.explored ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">Esplorata</span>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">
          {empty ? "Catalogo in arrivo" : `${progress.visited} / ${progress.total} città`}
        </span>
        <span className="font-semibold tabular-nums">{formatPercent(progress.percent)}</span>
      </div>
      <ProgressBar value={progress.percent} tone={progress.completed ? "gold" : "forest"} />
    </Link>
  );
}
