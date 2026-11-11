import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Search, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { diaryEntries, type DiarySort } from "@/lib/diary";
import { diaryPhotosQuery } from "@/lib/diary-photos";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { Crest } from "@/components/explorer/Crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sortSchema = z.enum(["date", "date-asc", "name", "name-desc"]);
const searchSchema = z.object({ q: z.string().catch(""), region: z.string().catch(""), sort: sortSchema.catch("date"), page: z.coerce.number().int().min(1).catch(1) });
export const Route = createFileRoute("/_authenticated/diario")({
  validateSearch: (search: Record<string, unknown>): { q?: string; region?: string; sort?: DiarySort; page?: number } => searchSchema.parse(search),
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
  const activeFilters = Number(!!filters.region) + Number(filters.sort !== "date");
  const all = diaryEntries(geo.municipalities, visits, { q: "", region: "", sort: "date" });
  const entries = diaryEntries(geo.municipalities, visits, filters);
  const pages = Math.max(1, Math.ceil(entries.length / 24));
  const page = Math.min(filters.page, pages);
  const visible = entries.slice((page - 1) * 24, page * 24);
  const photos = useQuery(diaryPhotosQuery(userId, visible.map(e => e.city.istat_code)));
  const photoByCity = new Map(photos.data?.map(p => [p.istat_code, p]));
  const update = (patch: Partial<typeof filters>) => navigate({ search: prev => ({ ...prev, page: 1, ...patch }), replace: true, resetScroll: false });

  return <div className="space-y-8">
    <header><p className="text-xs uppercase tracking-widest text-gold-foreground">Ricordi di viaggio</p><h1 className="mt-1 text-4xl font-semibold">Il mio diario</h1><p className="mt-2 text-muted-foreground">{all.length} {all.length === 1 ? "città visitata" : "città visitate"}</p></header>
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
        <select aria-label="Ordina il diario" className="h-10 min-w-0 rounded-md border bg-card px-3 text-sm" value={filters.sort} onChange={e => update({ sort: sortSchema.parse(e.target.value) })}><option value="date">Visite più recenti</option><option value="date-asc">Visite meno recenti</option><option value="name">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select>
      </div>{(activeFilters > 0 || filters.q) && <Button variant="ghost" size="sm" onClick={() => update({ q: "", region: "", sort: "date" })}><RotateCcw />Azzera filtri</Button>}</div>
      {photos.isError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">Impossibile caricare le anteprime.<Button variant="outline" size="sm" onClick={() => photos.refetch()}>Riprova</Button></div>}
      {entries.length === 0 && <p className="py-10 text-center text-muted-foreground">Nessuna città visitata corrisponde alla ricerca.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(({ city, visit }) => {
        const photo = photoByCity.get(city.istat_code);
        return <Link key={city.istat_code} to="/comune/$slug" params={{ slug: city.slug }} className="overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-lift">
          {photo ? <img src={photo.url} alt={photo.caption ?? `Ricordo di ${city.name}`} loading="lazy" className="aspect-[16/9] w-full object-cover" /> : <div className="flex aspect-[16/9] items-center justify-center border-b bg-parchment"><Crest name={city.name} url={city.coat_of_arms_url} visited size="lg" /></div>}
          <div className="p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{city.name}</h2><p className="text-sm text-muted-foreground">{geo.regionByCode.get(city.region_code)?.name}</p></div>{photo && city.coat_of_arms_url && <Crest name={city.name} url={city.coat_of_arms_url} visited />}</div>{visit.visit_date && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{new Date(`${visit.visit_date}T00:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>}{visit.notes?.trim() && <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-foreground/85">{visit.notes}</p>}</div>
        </Link>;
      })}</div>
      {pages > 1 && <div className="flex items-center justify-center gap-4"><Button variant="outline" size="icon" aria-label="Pagina precedente" disabled={page <= 1} onClick={() => update({ page: page - 1 })}><ChevronLeft /></Button><span className="text-sm text-muted-foreground">{page} / {pages}</span><Button variant="outline" size="icon" aria-label="Pagina successiva" disabled={page >= pages} onClick={() => update({ page: page + 1 })}><ChevronRight /></Button></div>}
    </>}
  </div>;
}