import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UserRound, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { computeProgress } from "@/lib/progress";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { ProgressBar, formatPercent } from "@/components/explorer/ProgressBar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profilo")({
  head: () => ({ meta: [
    { title: "Il mio profilo — Italia Explorer" }, { name: "description", content: "Il tuo account e i progressi reali del tuo passaporto di viaggio." },
    { property: "og:title", content: "Il mio profilo — Italia Explorer" }, { property: "og:description", content: "Il tuo profilo personale e le città esplorate." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfilePage,
  errorComponent: PersonalPageError,
});
function ProfilePage() { return <PersonalPage>{userId => <Profile userId={userId} />}</PersonalPage>; }
function Profile({ userId }: { userId: string }) {
  const { session } = useAuth();
  const { data: geo } = useSuspenseQuery(geoQuery);
  const { data: visits } = useSuspenseQuery(visitsQuery(userId));
  const navigate = Route.useNavigate();
  const [busy, setBusy] = useState(false);
  const stats = computeProgress(geo.regions, geo.municipalities, new Set(visits.filter(v => v.visited).map(v => v.istat_code)));
  const metadata = session?.user.user_metadata;
  const name = metadata?.["display_name"] ?? metadata?.["full_name"] ?? metadata?.["name"];
  async function logout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) { toast.error("Logout non riuscito. Riprova."); return; }
    await navigate({ to: "/auth", search: { redirect: undefined } });
  }
  return <div className="space-y-10"><header><p className="text-xs uppercase tracking-widest text-gold-foreground">Il tuo passaporto</p><h1 className="mt-1 text-4xl font-semibold">Il mio profilo</h1></header>
    <section className="flex items-center gap-5 border-b pb-8"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent"><UserRound className="h-9 w-9 text-primary" strokeWidth={1.5} /></div><div className="min-w-0">{typeof name === "string" && name.trim() && <h2 className="break-words text-3xl font-semibold">{name}</h2>}<p className="break-all text-muted-foreground">{session?.user.email}</p></div></section>
    <section className="grid gap-6 sm:grid-cols-3"><div><p className="text-4xl font-semibold text-primary">{stats.national.visited}</p><p className="mt-2 text-sm text-muted-foreground">Città visitate</p></div><div><p className="text-4xl font-semibold text-primary">{stats.regionsExplored}</p><p className="mt-2 text-sm text-muted-foreground">Regioni esplorate</p></div><div><p className="text-4xl font-semibold text-primary">{formatPercent(stats.national.percent)}</p><p className="mt-2 text-sm text-muted-foreground">Completamento del catalogo</p></div></section>
    <section><ProgressBar value={stats.national.percent} /><p className="mt-3 text-sm text-muted-foreground">{stats.national.visited} su {stats.national.total} città nel catalogo</p></section>
    <Button variant="outline" disabled={busy} onClick={logout}>{busy ? <Loader2 className="animate-spin" /> : <LogOut />}Logout</Button>
  </div>;
}