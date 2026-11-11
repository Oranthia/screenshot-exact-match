import { Info } from "lucide-react";

export function DemoNotice({ catalogCount }: { catalogCount: number }) {
  return (
    <div className="flex gap-2 border-l-2 border-gold pl-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
      <p className="text-secondary-foreground">
        <strong className="font-semibold">Catalogo in espansione.</strong> I progressi si riferiscono alle {catalogCount} città attualmente presenti.
      </p>
    </div>
  );
}
