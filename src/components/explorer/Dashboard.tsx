import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { computeProgress } from "@/lib/progress";
import { orderRegions } from "@/lib/region-order";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar, formatPercent } from "./ProgressBar";
import { RegionCard } from "./RegionCard";
import { MunicipalityCard } from "./MunicipalityCard";
import { StatTile } from "./StatTile";
import { DemoNotice } from "./DemoNotice";
import { BadgeShowcase } from "./BadgeShowcase";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Dashboard({ userId }: { userId: string }) {
  const geo = useQuery(geoQuery);
  const visits = useQuery(visitsQuery(userId));
  const [term, setTerm] = useState("");

  const visitedSet = useMemo(
    () => new Set((visits.data ?? []).filter((v) => v.visited).map((v) => v.istat_code)),
    [visits.data],
  );
  const stats = useMemo(
    () => (geo.data ? computeProgress(geo.data.regions, geo.data.municipalities, visitedSet) : null),
    [geo.data, visitedSet],
  );

  if (geo.isError || visits.isError) return <p className="p-8 text-center text-destructive">Impossibile caricare i dati. Riprova più tardi.</p>;
  if (!geo.data || !stats || !visits.data) return <DashboardSkeleton />;
  const g = geo.data;

  const muniByCode = new Map(g.municipalities.map((m) => [m.istat_code, m]));
  const recent = visits.data.filter((v) => v.visited && muniByCode.has(v.istat_code)).slice(0, 5);
  const results = term.trim().length >= 2 ? g.municipalities.filter((m) => norm(m.name).includes(norm(term.trim()))).slice(0, 8) : [];
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="bg-hero relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-lift sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-gold/30" />
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full border border-gold/20" />
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Il tuo passaporto</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-5xl">Italia esplorata al <span className="font-sans tabular-nums">{formatPercent(stats.national.percent)}</span></h1>
        <ProgressBar value={stats.national.percent} tone="gold" className="mt-4 h-2 bg-primary-foreground/15" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatTile label="Città visitate" value={`${stats.national.visited}`} sub={`su ${stats.national.total} nel catalogo`} />
          <StatTile label="Regioni esplorate" value={`${stats.regionsExplored} / ${stats.regionsTotal}`} sub={`${stats.regionsCompleted} completate`} />
        </div>
      </section>

      <BadgeShowcase userId={userId} />
      {!g.catalogComplete && <DemoNotice catalogCount={g.municipalities.length} />}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Cerca una città</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Dove sei stato? Es. Firenze" className="h-14 rounded-xl border-primary/30 bg-card pl-12 shadow-card" aria-label="Cerca una città" />
        </div>
        {term.trim().length >= 2 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {results.length === 0 && <p className="text-sm text-muted-foreground">Nessuna città trovata nel catalogo.</p>}
            {results.map((m) => (
              <MunicipalityCard key={m.istat_code} name={m.name} slug={m.slug} coatUrl={m.coat_of_arms_url}
                province={g.provinceByCode.get(m.province_code)?.abbreviation ?? ""} region={g.regionByCode.get(m.region_code)?.name}
                visited={visitedSet.has(m.istat_code)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Ultime città visitate</h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Il tuo passaporto è ancora vuoto. Cerca una città e segnala come visitata.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recent.map((v) => {
              const m = muniByCode.get(v.istat_code);
              if (!m) return null;
              return (
                <MunicipalityCard key={v.id} name={m.name} slug={m.slug} coatUrl={m.coat_of_arms_url} visited
                  province={g.provinceByCode.get(m.province_code)?.abbreviation ?? ""} region={g.regionByCode.get(m.region_code)?.name}
                  meta={v.visit_date ? fmtDate(v.visit_date) : undefined} />
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Le 20 regioni</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderRegions(g.regions, stats.perRegion).map((r) => {
            const progress = stats.perRegion.get(r.code);
            return progress ? <RegionCard key={r.code} name={r.name} slug={r.slug} progress={progress} /> : null;
          })}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    </div>
  );
}
