import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, tone = "forest" }: { value: number; className?: string; tone?: "forest" | "gold" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label="Progresso"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone === "gold" ? "bg-gold-gradient" : "bg-progress")}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export const formatPercent = (p: number) => `${p.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`;
