import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BADGES } from "@/lib/badges";
import { badgesQuery } from "@/lib/badge-queries";
import { Button } from "@/components/ui/button";
import { BadgeMedal } from "./BadgeMedal";

export function BadgeObserver({ userId }: { userId: string }) {
  const q = useQuery(badgesQuery(userId));
  const previous = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!q.data) return;
    const next = new Set(q.data.earned.map(b => b.badge_id));
    if (previous.current === null) {
      if (next.size) toast.message("Le tue conquiste sono aggiornate", { description: `${next.size} badge nella tua collezione.` });
    } else {
      const earned = BADGES.filter(b => next.has(b.id) && !previous.current?.has(b.id));
      if (earned.length === 1) {
        const badge = earned[0];
        if (badge) toast.custom(id => <div className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 shadow-lift"><BadgeMedal badge={badge} unlocked animate /><div className="min-w-0"><p className="text-xs text-muted-foreground">Nuova conquista sbloccata!</p><p className="text-xl font-semibold">{badge.name}</p><Button asChild variant="link" className="h-auto px-0" onClick={() => toast.dismiss(id)}><Link to="/badge">Vedi e metti in vetrina</Link></Button></div></div>, { duration: 7000 });
      } else if (earned.length) toast.message("Nuove conquiste sbloccate!", { description: `${earned.length} nuovi badge nella collezione.` });
    }
    previous.current = next;
  }, [q.data]);
  return null;
}