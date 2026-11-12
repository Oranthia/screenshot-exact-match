import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BADGES, BADGE_SECTIONS, badgeUnit, type BadgeDefinition } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { validateFeaturedSlot } from "@/lib/featured-slot";
import { PersonalPage, PersonalPageError } from "@/components/explorer/PersonalPage";
import { BadgeMedal } from "@/components/explorer/BadgeMedal";
import { ProgressBar } from "@/components/explorer/ProgressBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FeaturedSlots } from "@/components/explorer/FeaturedSlots";
import { setFeaturedSlot } from "@/data/backend";
import { useQueryClient } from "@tanstack/react-query";

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
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [detail, setDetail] = useState<BadgeDefinition | null>(null);
  const [placing, setPlacing] = useState<BadgeDefinition | null>(null);
  const ids = data.featured.map(f => f.badge_id);
  const earned = new Map(data.earned.map(b => [b.badge_id, b.earned_at]));
  async function updateSlot(position: number, id: string | null) {
    setPending(true);
    try {
      validateFeaturedSlot(position, id, data);
      await setFeaturedSlot(position, id);
      await qc.invalidateQueries({ queryKey: badgesQuery(userId).queryKey });
      setPlacing(null); toast.success("Vetrina aggiornata");
    } catch { toast.error("Impossibile aggiornare la vetrina. Riprova."); }
    finally { setPending(false); }
  }
  function place(badge: BadgeDefinition) {
    const free = [1,2,3].find(position => !data.featured.some(f => f.position === position));
    if (free) void updateSlot(free, badge.id);
    else setPlacing(badge);
  }
  const date = (value: string) => new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  return <div className="space-y-9"><header><p className="text-xs uppercase tracking-widest text-gold-foreground">Il tuo percorso</p><h1 className="mt-1 text-4xl font-semibold">Le mie conquiste</h1><p className="mt-2 text-sm text-muted-foreground">{data.earned.length} / {BADGES.length} badge sbloccati</p><ProgressBar value={data.earned.length / BADGES.length * 100} className="mt-3" /></header>
    <section aria-label="La tua vetrina" className="border-y py-4"><h2 className="text-2xl font-semibold">La tua vetrina</h2><FeaturedSlots userId={userId} data={data} /></section>
    <div role="group" aria-label="Filtra conquiste" className="flex gap-1 border-b pb-3">{([['all','Tutti'],['earned','Ottenuti'],['locked','Da sbloccare']] as const).map(([value,label]) => <Button key={value} variant={filter === value ? "secondary" : "ghost"} size="sm" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
    {BADGE_SECTIONS.map(section => {
      const items = BADGES.filter(b => b.metric === section.metric && (filter === "all" || (filter === "earned" ? earned.has(b.id) : !earned.has(b.id))));
      return items.length > 0 && <section key={section.metric} className="space-y-4"><h2 className="text-2xl font-semibold">{section.title}</h2><div className="badge-collection-grid">{items.map(badge => {
        const unlocked = earned.has(badge.id);
        return <Button key={badge.id} variant="ghost" className="h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-lg border bg-card px-2 py-4" aria-label={`Dettaglio ${badge.name}`} onClick={() => setDetail(badge)}><BadgeMedal badge={badge} unlocked={unlocked} /><span className="min-h-9 w-full break-words text-center text-xs font-semibold leading-4">{badge.name}</span><span className="text-[10px] text-muted-foreground">{badge.tier} · {unlocked ? "Sbloccato" : "Bloccato"}</span></Button>;
      })}</div></section>;
    })}
    {filter === "earned" && earned.size === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nessuna conquista ottenuta, per ora.</p>}
    <Dialog open={!!detail} onOpenChange={open => !open && setDetail(null)}><DialogContent className="badge-sheet max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle className="text-3xl">{detail?.name}</DialogTitle><DialogDescription>{detail?.description}</DialogDescription></DialogHeader>{detail && <><div className="flex justify-center py-3"><BadgeMedal badge={detail} unlocked={earned.has(detail.id)} large /></div><p className="text-center text-sm">{detail.tier} · Almeno {detail.threshold} {badgeUnit(detail.metric)}</p><p className="text-center text-sm text-muted-foreground">{earned.has(detail.id) ? `Sbloccato · ${date(earned.get(detail.id) ?? "")}` : `Bloccato · ${Math.min(data.metrics[detail.metric], detail.threshold)} / ${detail.threshold} ${badgeUnit(detail.metric)}`}</p>{earned.has(detail.id) && <Button disabled={pending} onClick={() => { setDetail(null); ids.includes(detail.id) ? void updateSlot(data.featured.find(f => f.badge_id === detail.id)?.position ?? 1, null) : place(detail); }}>{ids.includes(detail.id) ? "Rimuovi dalla vetrina" : "Metti in vetrina"}</Button>}</>}</DialogContent></Dialog>
    <Dialog open={!!placing} onOpenChange={open => !open && setPlacing(null)}><DialogContent className="badge-sheet"><DialogHeader><DialogTitle>Sostituisci una conquista</DialogTitle><DialogDescription>{placing?.name} prenderà il posto della conquista scelta.</DialogDescription></DialogHeader>{data.featured.map(({ badge_id: id, position }) => <Button key={id} variant="outline" disabled={pending} onClick={() => { if (placing) void updateSlot(position, placing.id); }}>{position} · {BADGES.find(b => b.id === id)?.name}</Button>)}</DialogContent></Dialog>
  </div>;
}