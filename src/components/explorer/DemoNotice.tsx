import { Info } from "lucide-react";

export function DemoNotice({ catalogCount }: { catalogCount: number }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-gold/60 bg-parchment p-4 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
      <p className="text-secondary-foreground">
        <strong className="font-semibold">Catalogo in espansione.</strong> Sono disponibili {catalogCount} città:
        le percentuali sono calcolate esclusivamente sulle città presenti nel catalogo.
      </p>
    </div>
  );
}
