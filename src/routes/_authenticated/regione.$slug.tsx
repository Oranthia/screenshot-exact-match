import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpZA, ChevronLeft, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { computeProgress } from "@/lib/progress";
import { AppHeader } from "@/components/explorer/AppHeader";
import { MunicipalityCard } from "@/components/explorer/MunicipalityCard";
import { ProgressBar, formatPercent } from "@/components/explorer/ProgressBar";
import { DemoNotice } from "@/components/explorer/DemoNotice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const Route = createFileRoute("/_authenticated/regione/$slug")({
  head: () => ({
    meta: [
      { title: "Regione — Italia Explorer" },
      { name: "description", content: "Città della regione, progresso di visita e ricerca." },
      { property: "og:title", content: "Regione — Italia Explorer" },
      { property: "og:description", content: "Esplora le città della regione." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionPage,
});

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function RegionPage() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const geo = useQuery(geoQuery);
  const visits = useQuery({ ...visitsQuery(userId), enabled: !!userId });
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "visited" | "todo">("all");
  const [asc, setAsc] = useState(true);

  const visitedSet = useMemo(() => new Set((visits.data ?? []).filter((v) => v.visited).map((v) => v.istat_code)), [visits.data]);
  const region = geo.data?.regions.find((r) => r.slug === slug);

  const list = useMemo(() => {
    if (!geo.data || !region) return [];
    return geo.data.municipalities
      .filter((m) => m.region_code === region.code)
      .filter((m) => !term.trim() || norm(m.name).includes(norm(term.trim())))
      .filter((m) => filter === "all" || (filter === "visited") === visitedSet.has(m.istat_code))
      .sort((a, b) => (asc ? 1 : -1) * a.name.localeCompare(b.name, "it"));
  }, [geo.data, region, term, filter, asc, visitedSet]);

  if (geo.data && !region) {
    return (
      <div className="min-h-screen"><AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">Regione non trovata</h1>
          <Link to="/" className="mt-4 inline-block text-primary underline">Torna alla dashboard</Link>
        </main>
      </div>
    );
  }

  const p = geo.data && region ? computeProgress([region], geo.data.municipalities.filter((m) => m.region_code === region.code), visitedSet).perRegion.get(region.code) : null;

  if (geo.isError || visits.isError) {
    return <div className="min-h-screen"><AppHeader /><main className="mx-auto max-w-5xl px-4 py-6 text-center">
      <p className="text-destructive">Impossibile caricare i dati. Riprova più tardi.</p>
      <Button variant="outline" className="mt-4" onClick={() => { geo.refetch(); visits.refetch(); }}>Riprova</Button>
    </main></div>;
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Dashboard</Link>
        {!region || !p || !visits.data ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : (
          <>
            <section className="paper rounded-3xl border p-6 shadow-card">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-foreground">Regione</p>
              <h1 className="text-5xl font-semibold">{region.name}</h1>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Progresso regionale</span>
                <span className="font-display text-3xl font-semibold tabular-nums">{formatPercent(p.percent)}</span>
              </div>
              <ProgressBar value={p.percent} tone={p.completed ? "gold" : "forest"} className="mt-2 h-2.5" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-accent p-3"><p className="font-display text-2xl font-semibold">{p.visited}</p><p className="text-xs text-accent-foreground">visitati</p></div>
                <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl font-semibold">{p.total - p.visited}</p><p className="text-xs text-muted-foreground">da visitare</p></div>
              </div>
            </section>
            {geo.data && !geo.data.catalogComplete && <DemoNotice catalogCount={geo.data.municipalities.length} />}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cerca per nome" className="h-11 rounded-xl bg-card pl-9" aria-label="Cerca città" />
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)} variant="outline">
                  <ToggleGroupItem value="all">Tutti</ToggleGroupItem>
                  <ToggleGroupItem value="visited">Visitati</ToggleGroupItem>
                  <ToggleGroupItem value="todo">Da visitare</ToggleGroupItem>
                </ToggleGroup>
                <Button variant="outline" size="icon" onClick={() => setAsc(!asc)} aria-label={asc ? "Ordina Z-A" : "Ordina A-Z"}>
                  {asc ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((m) => (
                <MunicipalityCard key={m.istat_code} name={m.name} slug={m.slug} coatUrl={m.coat_of_arms_url}
                  province={geo.data?.provinceByCode.get(m.province_code)?.name ?? ""} visited={visitedSet.has(m.istat_code)} />
              ))}
            </div>
            {list.length === 0 && (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {p.total === 0 ? "Le città di questa regione non sono ancora nel catalogo." : "Nessuna città corrisponde ai filtri."}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
