import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { computeProgress } from "@/lib/progress";
import { orderRegions } from "@/lib/region-order";
import { diaryEntries } from "@/lib/diary";
import { diaryPhotosQuery } from "@/lib/diary-photos";
import { DiaryCover } from "./DiaryCover";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar, formatPercent } from "./ProgressBar";
import { RegionCard } from "./RegionCard";
import { MunicipalityCard } from "./MunicipalityCard";
import { StatTile } from "./StatTile";
import { BadgeShowcase } from "./BadgeShowcase";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Dashboard({ userId }: { userId: string }) {
  const geo = useQuery(geoQuery);
  const visits = useQuery(visitsQuery(userId));
  const [term, setTerm] = useState("");
  const recentEntries = diaryEntries(geo.data?.municipalities ?? [], visits.data ?? [], { q: "", region: "", sort: "date" }).slice(0, 5);
  const photos = useQuery(diaryPhotosQuery(userId, recentEntries.map(e => e.city.istat_code)));
  const photoByCity = new Map(photos.data?.map(p => [p.istat_code, p]));

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

  const results = term.trim().length >= 2 ? g.municipalities.filter((m) => norm(m.name).includes(norm(term.trim()))).slice(0, 8) : [];
  const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

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
        {!g.catalogComplete && <p className="mt-3 text-xs text-primary-foreground/75">Catalogo in espansione · Progressi sulle città attualmente disponibili.</p>}
      </section>

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

      <BadgeShowcase userId={userId} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Ultime città visitate</h2>
        {recentEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Il tuo passaporto è ancora vuoto. Cerca una città e segnala come visitata.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recentEntries.map(({ city: m, visit: v }) => {
              return (
                <Link key={m.istat_code} to="/comune/$slug" params={{ slug: m.slug }} className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 shadow-card">
                  <DiaryCover compact name={m.name} coatUrl={m.coat_of_arms_url} photo={photoByCity.get(m.istat_code)} pending={photos.isPending} onRetry={() => { if (!photos.isFetching) void photos.refetch(); }} />
                  <div className="min-w-0"><h3 className="truncate text-xl font-semibold">{m.name}</h3><p className="text-xs text-muted-foreground">{g.regionByCode.get(m.region_code)?.name}</p>{v.visit_date && <p className="mt-1 text-xs text-muted-foreground">{fmtDate(v.visit_date)}</p>}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Esplora le regioni</h2>
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
