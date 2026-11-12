import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, MapPinned, Stamp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/explorer/AppHeader";
import { Dashboard } from "@/components/explorer/Dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Italia Explorer — Il passaporto delle città italiane" },
      { name: "description", content: "Segna le città visitate, conserva foto, video e note, e segui il tuo progresso in tutte le 20 regioni italiane." },
      { property: "og:title", content: "Italia Explorer — Il passaporto delle città italiane" },
      { property: "og:description", content: "Il diario di viaggio digitale per esplorare l'Italia città dopo città." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {loading ? <Skeleton className="h-64 rounded-3xl" /> : session ? <Dashboard userId={session.user.id} /> : <Landing />}
      </main>
    </div>
  );
}

function Landing() {
  const features = [
    { icon: Stamp, title: "Timbra le città", text: "Ogni città visitata sblocca il suo stemma a colori." },
    { icon: MapPinned, title: "20 regioni", text: "Segui i progressi regione per regione, fino al completamento." },
    { icon: Camera, title: "I tuoi ricordi", text: "Più esperienze per città, con date, note, foto e brevi video, tutto privato." },
  ];
  return (
    <div className="space-y-10">
      <section className="bg-hero rounded-3xl px-6 py-14 text-center text-primary-foreground shadow-lift sm:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Passaporto digitale di viaggio</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-5xl font-semibold leading-[1.05] sm:text-6xl">L'Italia, una città alla volta.</h1>
        <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">Raccogli i luoghi che hai visitato e custodisci i tuoi ricordi di viaggio.</p>
        <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full px-8">
          <Link to="/auth" search={{ redirect: undefined }}>Inizia il viaggio</Link>
        </Button>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="paper rounded-2xl border p-5 shadow-card">
            <f.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-2xl font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
