import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronLeft, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { geoQuery, useSaveVisit, visitsQuery } from "@/lib/queries";
import { AppHeader } from "@/components/explorer/AppHeader";
import { Crest } from "@/components/explorer/Crest";
import { MediaGallery } from "@/components/explorer/MediaGallery";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comune/$slug")({
  head: () => ({
    meta: [
      { title: "Scheda comune — Italia Explorer" },
      { name: "description", content: "Stemma, stato di visita, note e ricordi del comune." },
      { property: "og:title", content: "Scheda comune — Italia Explorer" },
      { property: "og:description", content: "Il tuo diario di viaggio per questo comune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MunicipalityPage,
});

function MunicipalityPage() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const geo = useQuery(geoQuery);
  const visits = useQuery({ ...visitsQuery(userId), enabled: !!userId });
  const save = useSaveVisit(userId);

  const m = geo.data?.municipalities.find((x) => x.slug === slug);
  const visit = m ? visits.data?.find((v) => v.istat_code === m.istat_code) : undefined;
  const visited = visit?.visited ?? false;

  const [notes, setNotes] = useState("");
  useEffect(() => setNotes(visit?.notes ?? ""), [visit?.notes, m?.istat_code]);

  if (geo.data && !m) {
    return (
      <div className="min-h-screen"><AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">Comune non trovato</h1>
          <Link to="/" className="mt-4 inline-block text-primary underline">Torna alla dashboard</Link>
        </main>
      </div>
    );
  }
  if (!m || !visits.data || !geo.data) {
    return <div className="min-h-screen"><AppHeader /><main className="mx-auto max-w-3xl px-4 py-6"><Skeleton className="h-80 rounded-3xl" /></main></div>;
  }

  const province = geo.data.provinceByCode.get(m.province_code);
  const region = geo.data.regionByCode.get(m.region_code);
  const date = visit?.visit_date ? new Date(`${visit.visit_date}T00:00:00`) : undefined;

  const persist = (patch: { visited?: boolean; visit_date?: string | null; notes?: string | null }, ok?: string) =>
    save.mutate({ istat_code: m.istat_code, ...patch }, {
      onSuccess: () => ok && toast.success(ok),
      onError: () => toast.error("Salvataggio non riuscito. Riprova."),
    });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        {region && (
          <Link to="/regione/$slug" params={{ slug: region.slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> {region.name}
          </Link>
        )}

        <section className={cn("paper relative overflow-hidden rounded-3xl border p-6 shadow-lift transition-colors sm:p-8", visited && "border-gold")}>
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <Crest key={m.istat_code} name={m.name} url={m.coat_of_arms_url} visited={visited} size="lg" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-foreground">Comune · ISTAT {m.istat_code}</p>
              <h1 className="text-5xl font-semibold leading-none">{m.name}</h1>
              <p className="mt-2 text-muted-foreground">
                {province ? `Provincia di ${province.name} (${province.abbreviation})` : ""} · {region?.name}
              </p>
              <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-card">
                <Switch
                  checked={visited}
                  disabled={save.isPending}
                  onCheckedChange={(on) => persist({ visited: on }, on ? `${m.name} sbloccata!` : undefined)}
                  aria-label="Visitata"
                />
                <span className={cn("text-sm font-semibold", visited ? "text-primary" : "text-muted-foreground")}>
                  {visited ? "Visitata" : "Non visitata"}
                </span>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </label>
            </div>
          </div>
          {!m.coat_of_arms_url && <p className="mt-4 text-center text-xs text-muted-foreground sm:text-left">Stemma ufficiale non ancora disponibile.</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Data della visita</h2>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start rounded-xl", !date && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "d MMMM yyyy", { locale: it }) : "Scegli una data (facoltativa)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" locale={it} selected={date} disabled={{ after: new Date() }}
                  onSelect={(d) => persist({ visit_date: d ? format(d, "yyyy-MM-dd") : null }, "Data salvata")} />
              </PopoverContent>
            </Popover>
            {date && (
              <Button variant="ghost" size="icon" aria-label="Rimuovi data" onClick={() => persist({ visit_date: null })}><X className="h-4 w-4" /></Button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Note di viaggio</h2>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} maxLength={5000}
            placeholder="Racconta la tua esperienza: cosa hai visto, mangiato, chi hai incontrato…" className="rounded-xl bg-card" />
          <div className="flex justify-end">
            <Button disabled={save.isPending || notes === (visit?.notes ?? "")} onClick={() => persist({ notes: notes.trim() || null }, "Note salvate")}>
              Salva note
            </Button>
          </div>
        </section>

        <MediaGallery userId={userId} istat={m.istat_code} />
      </main>
    </div>
  );
}
