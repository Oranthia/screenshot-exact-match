import { Info } from "lucide-react";

export function DemoNotice({ catalogCount, nationalTotal }: { catalogCount: number; nationalTotal: number }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-gold/60 bg-parchment p-4 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
      <p className="text-secondary-foreground">
        <strong className="font-semibold">Statistiche dimostrative.</strong> Il catalogo contiene per ora {catalogCount} comuni
        su circa {nationalTotal.toLocaleString("it-IT")} comuni italiani: le percentuali sono calcolate solo su quelli presenti.
      </p>
    </div>
  );
}
