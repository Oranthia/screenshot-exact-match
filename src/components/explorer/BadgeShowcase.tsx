import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BADGES } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { Button } from "@/components/ui/button";
import { FeaturedSlots } from "./FeaturedSlots";

export function BadgeShowcase({ userId }: { userId: string }) {
  const q = useQuery(badgesQuery(userId));
  return <section className="space-y-3" aria-label="Vetrina delle conquiste"><div className="flex items-center justify-between gap-2"><div><h2 className="text-2xl font-semibold">Le mie conquiste</h2><p className="text-xs text-muted-foreground">{q.data ? `${q.data.earned.length} / ${BADGES.length} sbloccate` : "…"}</p></div><Button asChild variant="ghost" size="sm"><Link to="/badge">Gestisci</Link></Button></div>
    {q.isError ? <p role="alert" className="text-sm text-destructive">Impossibile caricare le conquiste. <Button variant="link" size="sm" onClick={() => q.refetch()}>Riprova</Button></p> : q.data ? <div className="border-y"><FeaturedSlots userId={userId} data={q.data} /></div> : <div className="h-36 animate-pulse bg-muted" />}
  </section>;
}