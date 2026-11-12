import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { geoQuery, useSaveVisit, visitsQuery } from "@/lib/queries";
import { AppHeader } from "@/components/explorer/AppHeader";
import { Crest } from "@/components/explorer/Crest";
import { CityExperiences } from "@/components/explorer/CityExperiences";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comune/$slug")({
  head: () => ({
    meta: [
      { title: "Scheda città — Italia Explorer" },
      { name: "description", content: "Stemma, stato di visita, note e ricordi della città." },
      { property: "og:title", content: "Scheda città — Italia Explorer" },
      { property: "og:description", content: "Il tuo diario di viaggio per questa città." },
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

  if (geo.isError || visits.isError) {
    return <div className="min-h-screen"><AppHeader /><main className="mx-auto max-w-3xl px-4 py-6 text-center">
      <p className="text-destructive">Impossibile caricare i dati. Riprova più tardi.</p>
      <Button variant="outline" className="mt-4" onClick={() => { geo.refetch(); visits.refetch(); }}>Riprova</Button>
    </main></div>;
  }

  if (geo.data && !m) {
    return (
      <div className="min-h-screen"><AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">Città non trovata</h1>
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

        <section className={cn("paper relative overflow-hidden rounded-3xl border p-4 shadow-lift transition-colors sm:p-6", visited && "border-gold")}>
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
            <Crest key={m.istat_code} name={m.name} url={m.coat_of_arms_url} visited={visited} size="lg" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-foreground">Città</p>
              <h1 className="break-words text-4xl font-semibold leading-tight sm:text-5xl">{m.name}</h1>
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

        <CityExperiences userId={userId} city={m} />
      </main>
    </div>
  );
}
