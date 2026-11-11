import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { BADGES } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { Button } from "@/components/ui/button";
import { BadgeMedal } from "./BadgeMedal";

export function BadgeShowcase({ userId }: { userId: string }) {
  const q = useQuery(badgesQuery(userId));
  return <section className="space-y-3" aria-label="Vetrina delle conquiste"><div className="flex items-center justify-between gap-2"><div><h2 className="text-2xl font-semibold">Le mie conquiste</h2><p className="text-xs text-muted-foreground">{q.data ? `${q.data.earned.length} / ${BADGES.length} sbloccate` : "…"}</p></div><Button asChild variant="ghost" size="sm"><Link to="/badge">Gestisci</Link></Button></div>
    {q.isError ? <p role="alert" className="text-sm text-destructive">Impossibile caricare le conquiste. <Button variant="link" size="sm" onClick={() => q.refetch()}>Riprova</Button></p> : <><div className="grid grid-cols-3 gap-2 border-y py-4">{[1, 2, 3].map(position => {
      const id = q.data?.featured.find(f => f.position === position)?.badge_id;
      const badge = BADGES.find(b => b.id === id);
      return <Button key={position} asChild variant="ghost" className="h-auto min-w-0 flex-col gap-2 whitespace-normal px-1 py-1"><Link to="/badge">{badge ? <BadgeMedal badge={badge} unlocked /> : <span className="flex h-24 w-20 items-center justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-primary/35 text-primary"><Plus className="h-5 w-5" /></span></span>}<span className="w-full break-words text-center text-xs leading-4">{badge?.name ?? `Spazio ${position}`}</span></Link></Button>;
    })}</div>{q.data?.earned.length === 0 && <p className="text-xs text-muted-foreground">La tua prima conquista comincia dalla prossima città.</p>}</>}
  </section>;
}