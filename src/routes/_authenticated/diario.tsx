import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Images, CalendarDays, Search, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { diaryEntries, type DiarySort } from "@/lib/diary";
import { diaryPhotosQuery } from "@/lib/diary-photos";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { DiaryAlbum, DiaryTimeline } from "@/components/explorer/DiaryViews";
import { diaryModeKey, timelineEntries, type DiaryMode } from "@/lib/diary-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sortSchema = z.enum(["date", "date-asc", "name", "name-desc"]);
const searchSchema = z.object({ q: z.string().catch(""), region: z.string().catch(""), year: z.string().regex(/^\d{4}$/).or(z.literal("")).catch(""), sort: sortSchema.catch("date"), page: z.coerce.number().int().min(1).catch(1) });
export const Route = createFileRoute("/_authenticated/diario")({
  validateSearch: (search: Record<string, unknown>): { q?: string; region?: string; year?: string; sort?: DiarySort; page?: number } => searchSchema.parse(search),
  head: () => ({ meta: [
    { title: "Il mio diario — Italia Explorer" },
    { name: "description", content: "Le tue città visitate, le date e le fotografie dei tuoi viaggi in Italia." },
    { property: "og:title", content: "Il mio diario — Italia Explorer" },
    { property: "og:description", content: "Il diario personale delle città esplorate in Italia." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DiaryPage,
  errorComponent: PersonalPageError,
});

function DiaryPage() { return <PersonalPage>{userId => <Diary userId={userId} />}</PersonalPage>; }

function Diary({ userId }: { userId: string }) {
  const { data: geo } = useSuspenseQuery(geoQuery);
  const { data: visits } = useSuspenseQuery(visitsQuery(userId));
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters = searchSchema.parse(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mode, setMode] = useState<DiaryMode>("album");
  useEffect(() => {
    try { setMode(localStorage.getItem(diaryModeKey(userId)) === "timeline" ? "timeline" : "album"); } catch { setMode("album"); }
  }, [userId]);
  const activeFilters = Number(!!filters.region) + Number(filters.sort !== "date") + Number(mode === "timeline" && !!filters.year);
  const all = diaryEntries(geo.municipalities, visits, { q: "", region: "", sort: "date" });
  const filtered = diaryEntries(geo.municipalities, visits, filters);
  const entries = mode === "timeline" ? timelineEntries(filtered, filters.year, filters.sort === "date-asc") : filtered;
  const years = [...new Set(all.flatMap(e => e.visit.visit_date ? [e.visit.visit_date.slice(0, 4)] : []))].sort().reverse();
  const pages = Math.max(1, Math.ceil(entries.length / 24));
  const page = Math.min(filters.page, pages);
  const visible = entries.slice((page - 1) * 24, page * 24);
  const photos = useQuery(diaryPhotosQuery(userId, visible.map(e => e.city.istat_code)));
  const photoByCity = new Map(photos.data?.map(p => [p.istat_code, p]));
  const update = (patch: Partial<typeof filters>) => navigate({ search: prev => ({ ...prev, page: 1, ...patch }), replace: true, resetScroll: false });

  return <div className="space-y-8">
    <header><p className="text-xs uppercase tracking-widest text-gold-foreground">Ricordi di viaggio</p><h1 className="mt-1 text-4xl font-semibold">Il mio diario</h1><p className="mt-2 text-muted-foreground">{all.length} {all.length === 1 ? "città visitata" : "città visitate"}</p></header>
    <div role="group" aria-label="Visualizzazione diario" className="inline-flex rounded-lg border bg-card p-1">{([['album', 'Album', Images], ['timeline', 'Cronologia', CalendarDays]] as const).map(([value, label, Icon]) => <Button key={value} variant={mode === value ? "secondary" : "ghost"} size="sm" aria-pressed={mode === value} onClick={() => { setMode(value); try { localStorage.setItem(diaryModeKey(userId), value); } catch { /* Browsing preferences are optional. */ } void update({ page: 1 }); }}><Icon className="h-4 w-4" />{label}</Button>)}</div>
    {all.length === 0 ? <section className="flex flex-col items-center gap-5 py-16 text-center">
      <BookOpen className="h-14 w-14 text-primary" strokeWidth={1.25} />
      <p className="max-w-md text-muted-foreground">Il tuo diario è ancora vuoto. Inizia a esplorare l'Italia e raccogli i tuoi ricordi!</p>
      <Button asChild><Link to="/">Esplora le città</Link></Button>
    </section> : <>
      <div className="space-y-3"><div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Cerca nel diario" placeholder="Cerca una città" value={filters.q} onChange={e => update({ q: e.target.value })} className="h-11 bg-card pl-9" /></div>
        <Button variant={activeFilters ? "secondary" : "outline"} className="h-11 shrink-0" aria-expanded={filtersOpen} aria-controls="diary-filters" onClick={() => setFiltersOpen(open => !open)}><SlidersHorizontal />Filtri{activeFilters > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs tabular-nums text-primary-foreground" aria-label={`${activeFilters} filtri attivi`}>{activeFilters}</span>}<ChevronDown className={filtersOpen ? "rotate-180 transition-transform" : "transition-transform"} /></Button>
        </div><div id="diary-filters" hidden={!filtersOpen} className="grid gap-3 sm:grid-cols-2">
        <select aria-label="Filtra per regione" className="h-10 min-w-0 rounded-md border bg-card px-3 text-sm" value={filters.region} onChange={e => update({ region: e.target.value })}><option value="">Tutte le regioni</option>{geo.regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
        <select aria-label="Ordina il diario" className="h-10 min-w-0 rounded-md border bg-card px-3 text-sm" value={mode === "timeline" && !filters.sort.startsWith("date") ? "date" : filters.sort} onChange={e => update({ sort: sortSchema.parse(e.target.value) })}><option value="date">Visite più recenti</option><option value="date-asc">Visite meno recenti</option>{mode === "album" && <><option value="name">Nome A–Z</option><option value="name-desc">Nome Z–A</option></>}</select>
        {mode === "timeline" && <select aria-label="Filtra per anno" className="h-10 min-w-0 rounded-md border bg-card px-3 text-sm" value={filters.year} onChange={e => update({ year: e.target.value })}><option value="">Tutti gli anni</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select>}
      </div>{(activeFilters > 0 || filters.q) && <Button variant="ghost" size="sm" onClick={() => update({ q: "", region: "", year: "", sort: "date" })}><RotateCcw />Azzera filtri</Button>}</div>
      {photos.isError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">Impossibile caricare le anteprime.<Button variant="outline" size="sm" onClick={() => photos.refetch()}>Riprova</Button></div>}
      {entries.length === 0 && <p className="py-10 text-center text-muted-foreground">Nessuna città visitata corrisponde alla ricerca.</p>}
      {mode === "album" ? <DiaryAlbum entries={visible} regions={geo.regionByCode} photos={photoByCity} pending={photos.isPending} retry={() => { if (!photos.isFetching) void photos.refetch(); }} /> : <DiaryTimeline entries={visible} regions={geo.regionByCode} photos={photoByCity} pending={photos.isPending} retry={() => { if (!photos.isFetching) void photos.refetch(); }} />}
      {pages > 1 && <div className="flex items-center justify-center gap-4"><Button variant="outline" size="icon" aria-label="Pagina precedente" disabled={page <= 1} onClick={() => update({ page: page - 1 })}><ChevronLeft /></Button><span className="text-sm text-muted-foreground">{page} / {pages}</span><Button variant="outline" size="icon" aria-label="Pagina successiva" disabled={page >= pages} onClick={() => update({ page: page + 1 })}><ChevronRight /></Button></div>}
    </>}
  </div>;
}