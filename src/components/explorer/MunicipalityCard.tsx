import { Link } from "@tanstack/react-router";
import { Crest } from "./Crest";
import { cn } from "@/lib/utils";

type Props = { name: string; slug: string; province: string; region?: string | undefined; coatUrl?: string | null | undefined; visited: boolean; meta?: string | undefined };

export function MunicipalityCard({ name, slug, province, region, coatUrl, visited, meta }: Props) {
  return (
    <Link
      to="/comune/$slug"
      params={{ slug }}
      className="flex items-center gap-4 rounded-2xl border bg-card p-3 pr-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <Crest name={name} url={coatUrl} visited={visited} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-semibold leading-tight">{name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {province}
          {region ? ` · ${region}` : ""}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
          visited ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {visited ? "Visitata" : "Da visitare"}
      </span>
    </Link>
  );
}
