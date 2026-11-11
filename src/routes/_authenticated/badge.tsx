import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { BADGES, BADGE_SECTIONS, badgeUnit, type BadgeDefinition } from "@/lib/badges";
import { badgesQuery, useFeaturedBadges } from "@/lib/badge-queries";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { BadgeMedal } from "@/components/explorer/BadgeMedal";
import { ProgressBar } from "@/components/explorer/ProgressBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/badge")({
  head: () => ({ meta: [
    { title: "Le mie conquiste — Italia Explorer" }, { name: "description", content: "La tua collezione personale di medaglie di viaggio e le tre conquiste in vetrina." },
    { property: "og:title", content: "Le mie conquiste — Italia Explorer" }, { property: "og:description", content: "Dodici traguardi tra città, regioni e ricordi di viaggio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <PersonalPage>{userId => <Collection userId={userId} />}</PersonalPage>,
  errorComponent: PersonalPageError,
});
function Collection({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(badgesQuery(userId));
  const save = useFeaturedBadges(userId);
  const [detail, setDetail] = useState<BadgeDefinition | null>(null);
  const [placing, setPlacing] = useState<BadgeDefinition | null>(null);
  const ids = data.featured.map(f => f.badge_id);
  const earned = new Map(data.earned.map(b => [b.badge_id, b.earned_at]));
  async function update(next: string[]) {
    try { await save.mutateAsync(next); setPlacing(null); toast.success("Vetrina aggiornata"); }
    catch { toast.error("Impossibile aggiornare la vetrina. Riprova."); }
  }
  function place(badge: BadgeDefinition) {
    if (ids.length < 3) void update([...ids, badge.id]);
    else setPlacing(badge);
  }
  const date = (value: string) => new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  return <div className="space-y-9"><header><p className="text-xs uppercase tracking-widest text-gold-foreground">Il tuo percorso</p><h1 className="mt-1 text-4xl font-semibold">Le mie conquiste</h1><p className="mt-2 text-sm text-muted-foreground">{data.earned.length} / {BADGES.length} badge sbloccati</p><ProgressBar value={data.earned.length / BADGES.length * 100} className="mt-3" /></header>
    <section aria-label="La tua vetrina" className="space-y-4 border-y py-5"><h2 className="text-2xl font-semibold">La tua vetrina</h2><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map(index => {
      const badge = BADGES.find(b => b.id === ids[index]);
      return <div key={index} className="flex min-w-0 flex-col items-center gap-2">{badge ? <BadgeMedal badge={badge} unlocked /> : <span className="flex h-24 w-20 items-center justify-center"><Plus className="h-8 w-8 text-muted-foreground" strokeWidth={1} /></span>}
        <Select value={ids[index] ?? "empty"} disabled={save.isPending} onValueChange={value => {
          const next = [...ids];
          if (value === "empty") next.splice(index, 1);
          else { const existing = next.indexOf(value); if (existing >= 0) { const old = next[index]; if (old) next[existing] = old; else next.splice(existing, 1); } next[Math.min(index, next.length)] = value; }
          void update(next);
        }}><SelectTrigger className="w-full bg-card text-xs" aria-label={`Conquista in posizione ${index + 1}`}><SelectValue placeholder={`Spazio ${index + 1}`} /></SelectTrigger><SelectContent><SelectItem value="empty">Spazio vuoto</SelectItem>{BADGES.filter(b => earned.has(b.id)).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
        {badge && <Button variant="ghost" size="icon" title={`Rimuovi ${badge.name}`} aria-label={`Rimuovi ${badge.name}`} disabled={save.isPending} onClick={() => update(ids.filter(id => id !== badge.id))}><X className="h-4 w-4" /></Button>}
      </div>;
    })}</div></section>
    {BADGE_SECTIONS.map(section => <section key={section.metric} className="space-y-4"><h2 className="text-2xl font-semibold">{section.title}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{BADGES.filter(b => b.metric === section.metric).map(badge => {
      const earnedAt = earned.get(badge.id);
      const unlocked = !!earnedAt;
      const featured = ids.includes(badge.id);
      const current = Math.min(data.metrics[badge.metric], badge.threshold);
      return <article key={badge.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-card"><Button variant="ghost" className="h-auto flex-col gap-3 whitespace-normal p-0 hover:bg-transparent" aria-label={`Dettaglio ${badge.name}`} onClick={() => setDetail(badge)}><BadgeMedal badge={badge} unlocked={unlocked} /><h3 className="text-2xl font-semibold">{badge.name}</h3></Button><p className="mt-2 text-center text-sm text-muted-foreground">{badge.description}</p><p className="mt-3 text-center text-xs font-semibold text-primary">{badge.tier} · {unlocked ? "Sbloccato" : "Bloccato"}</p><div className="mt-auto pt-3">{earnedAt ? <p className="text-center text-xs text-muted-foreground">Ottenuto il {date(earnedAt)}</p> : <><ProgressBar value={current / badge.threshold * 100} className="h-1" /><p className="mt-2 text-center text-xs text-muted-foreground">{current} / {badge.threshold} {badgeUnit(badge.metric)}</p></>}{unlocked && <Button variant={featured ? "ghost" : "outline"} size="sm" className="mt-3 w-full" disabled={save.isPending} onClick={() => featured ? update(ids.filter(id => id !== badge.id)) : place(badge)}>{featured ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{featured ? "Rimuovi dalla vetrina" : "Metti in vetrina"}</Button>}</div></article>;
    })}</div></section>)}
    <Dialog open={!!detail} onOpenChange={open => !open && setDetail(null)}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="text-3xl">{detail?.name}</DialogTitle><DialogDescription>{detail?.description}</DialogDescription></DialogHeader>{detail && <><div className="flex justify-center py-3"><BadgeMedal badge={detail} unlocked={earned.has(detail.id)} large /></div><p className="text-center text-sm">{detail.tier} · Almeno {detail.threshold} {badgeUnit(detail.metric)}</p><p className="text-center text-sm text-muted-foreground">{earned.has(detail.id) ? `Sbloccato · ${date(earned.get(detail.id) ?? "")}` : `Bloccato · ${Math.min(data.metrics[detail.metric], detail.threshold)} / ${detail.threshold}`}</p>{earned.has(detail.id) && <Button disabled={save.isPending} onClick={() => { setDetail(null); ids.includes(detail.id) ? void update(ids.filter(id => id !== detail.id)) : place(detail); }}>{ids.includes(detail.id) ? "Rimuovi dalla vetrina" : "Metti in vetrina"}</Button>}</>}</DialogContent></Dialog>
    <Dialog open={!!placing} onOpenChange={open => !open && setPlacing(null)}><DialogContent><DialogHeader><DialogTitle>Sostituisci una conquista</DialogTitle><DialogDescription>{placing?.name} prenderà il posto della conquista scelta.</DialogDescription></DialogHeader>{ids.map((id, i) => <Button key={id} variant="outline" disabled={save.isPending} onClick={() => { if (placing) void update(ids.map((old, j) => j === i ? placing.id : old)); }}>{i + 1} · {BADGES.find(b => b.id === id)?.name}</Button>)}</DialogContent></Dialog>
  </div>;
}