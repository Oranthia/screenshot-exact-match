import { useState } from "react";
import { Plus, ArrowLeftRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, type BadgeState } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BadgeMedal } from "./BadgeMedal";

export function FeaturedSlots({ userId, data }: { userId: string; data: BadgeState }) {
  const qc = useQueryClient();
  const [slot, setSlot] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [pending, setPending] = useState(false);
  const chosen = data.featured.find(f => f.position === slot);
  async function save(id: string | null) {
    if (slot === null) return;
    setPending(true);
    try {
      const { error } = await supabase.rpc("set_my_featured_badge_slot", { _position: slot, _badge_id: id as string });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: badgesQuery(userId).queryKey });
      setSlot(null); toast.success("Vetrina aggiornata");
    } catch { toast.error("Impossibile aggiornare la vetrina. Riprova."); }
    finally { setPending(false); }
  }
  return <><div className="grid grid-cols-3 gap-2 py-4">{[1,2,3].map(position => {
    const badge = BADGES.find(b => b.id === data.featured.find(f => f.position === position)?.badge_id);
    return <Button key={position} variant="ghost" className="h-auto min-w-0 flex-col gap-2 whitespace-normal px-1 py-1" aria-label={`Gestisci spazio ${position}`} onClick={() => { setSlot(position); setSelecting(!badge); }}>
      {badge ? <BadgeMedal badge={badge} unlocked /> : <span className="flex h-24 w-20 items-center justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-primary/35 text-primary"><Plus className="h-5 w-5" /></span></span>}
      <span className="min-h-8 w-full break-words text-center text-xs leading-4">{badge?.name ?? `Spazio ${position}`}</span>
    </Button>;
  })}</div><Dialog open={slot !== null} onOpenChange={open => { if (!open && !pending) setSlot(null); }}><DialogContent className="badge-sheet max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{selecting ? "Scegli una conquista" : BADGES.find(b => b.id === chosen?.badge_id)?.name}</DialogTitle><DialogDescription>Vetrina · Spazio {slot}</DialogDescription></DialogHeader>
    {selecting ? <>{data.earned.length === 0 && <p className="text-sm text-muted-foreground">Non hai ancora conquiste da esporre.</p>}<div className="grid grid-cols-2 gap-3">{BADGES.filter(b => data.earned.some(e => e.badge_id === b.id)).map(b => <Button key={b.id} variant="ghost" disabled={pending} className="h-auto flex-col whitespace-normal py-3 text-xs" onClick={() => save(b.id)}><BadgeMedal badge={b} unlocked />{b.name}</Button>)}</div></> : <><Button variant="outline" disabled={pending} onClick={() => setSelecting(true)}><ArrowLeftRight />Sostituisci</Button><Button variant="ghost" disabled={pending} onClick={() => save(null)}><Trash2 />Rimuovi</Button></>}
  </DialogContent></Dialog></>;
}