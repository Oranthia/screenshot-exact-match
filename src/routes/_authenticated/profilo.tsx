import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UserRound, LogOut, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { geoQuery, visitsQuery } from "@/lib/queries";
import { computeProgress } from "@/lib/progress";
import { BADGES } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { ProgressBar, formatPercent } from "@/components/explorer/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const { data: badges } = useSuspenseQuery(badgesQuery(userId));
  const navigate = Route.useNavigate();
  const [busy, setBusy] = useState(false);
  const stats = computeProgress(geo.regions, geo.municipalities, new Set(visits.filter(v => v.visited).map(v => v.istat_code)));
  const metadata = session?.user.user_metadata;
  const name = metadata?.["display_name"] ?? metadata?.["full_name"] ?? metadata?.["name"];
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: draftName.trim() } });
    setSavingName(false);
    if (error) { toast.error("Impossibile salvare il nome. Riprova."); return; }
    setEditing(false);
    toast.success("Nome aggiornato");
  }
  async function logout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) { toast.error("Logout non riuscito. Riprova."); return; }
    await navigate({ to: "/auth", search: { redirect: undefined } });
  }
  return <div className="space-y-10"><header><p className="text-xs uppercase tracking-widest text-gold-foreground">Il tuo passaporto</p><h1 className="mt-1 text-4xl font-semibold">Il mio profilo</h1></header>
    <section className="flex items-center gap-4 border-b pb-6"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent"><UserRound className="h-8 w-8 text-primary" strokeWidth={1.5} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2">{typeof name === "string" && name.trim() ? <h2 className="min-w-0 break-words text-3xl font-semibold">{name}</h2> : <span className="text-sm text-muted-foreground">Nome visualizzato</span>}<Button variant="ghost" size="icon" aria-label="Modifica nome" title="Modifica nome" onClick={() => { setDraftName(typeof name === "string" ? name : ""); setEditing(true); }}><Pencil /></Button></div><p className="break-all text-sm text-muted-foreground">{session?.user.email}</p></div></section>
    {editing && <form onSubmit={saveName} className="flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-sm font-medium">Nome visualizzato<Input className="mt-2 bg-card" value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={80} autoFocus /></label><Button type="submit" size="icon" aria-label="Salva nome" title="Salva nome" disabled={savingName}>{savingName ? <Loader2 className="animate-spin" /> : <Check />}</Button><Button variant="ghost" size="icon" aria-label="Annulla" title="Annulla" onClick={() => setEditing(false)}><X /></Button></form>}
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ value: stats.national.visited, label: "Città visitate" }, { value: stats.regionsExplored, label: "Regioni esplorate" }, { value: formatPercent(stats.national.percent), label: "Completamento catalogo" }].map((stat, i) => <div key={stat.label} className={`rounded-lg border bg-card p-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}><p className="font-sans text-3xl font-semibold tabular-nums text-primary">{stat.value}</p><p className="mt-2 text-sm text-muted-foreground">{stat.label}</p></div>)}</section>
    <section><ProgressBar value={stats.national.percent} /><p className="mt-3 text-sm text-muted-foreground">{stats.national.visited} su {stats.national.total} città nel catalogo</p></section>
    <section className="flex items-center justify-between gap-3 border-y py-5"><div><h2 className="text-2xl font-semibold">Le mie conquiste</h2><p className="mt-1 text-sm text-muted-foreground">{badges.earned.length} / {BADGES.length} badge ottenuti</p></div><Button asChild variant="outline"><Link to="/badge">Collezione</Link></Button></section>
    <Button variant="outline" disabled={busy} onClick={logout}>{busy ? <Loader2 className="animate-spin" /> : <LogOut />}Logout</Button>
  </div>;
}