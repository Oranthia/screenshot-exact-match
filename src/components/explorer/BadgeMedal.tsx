import { Footprints, Compass, Backpack, BookOpen, Route, Sunrise, Mountain, Trees, Navigation, Globe, Camera, Images, Lock, type LucideIcon } from "lucide-react";
import type { BadgeDefinition } from "@/lib/badges";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { Footprints, Compass, Backpack, BookOpen, Route, Sunrise, Mountain, Trees, Navigation, Globe, Camera, Images };
export function BadgeMedal({ badge, unlocked, large = false, animate = false }: { badge: BadgeDefinition; unlocked: boolean; large?: boolean; animate?: boolean }) {
  const Icon = icons[badge.icon] ?? Compass;
  return <div aria-hidden="true" className={cn("badge-medal", `badge-${badge.tier.toLowerCase()}`, large && "badge-medal-large", !unlocked && "badge-medal-locked", animate && "motion-safe:animate-unlock")}>
    <svg className="badge-ribbons" viewBox="0 0 100 120"><path d="M25 61 L9 110 L28 101 L39 118 L53 67 Z M75 61 L91 110 L72 101 L61 118 L47 67 Z" fill="currentColor"/><path d="M26 67 L16 99 M74 67 L84 99" fill="none" stroke="var(--badge-metal)" strokeWidth="2" /></svg>
    <div className="badge-disc">{badge.imageUrl ? <img src={badge.imageUrl} alt="" className="h-full w-full rounded-full object-contain" /> : <><span className="badge-ornament">✦</span><Icon strokeWidth={1.35} className="badge-icon" /><span className="badge-ornament badge-ornament-bottom">• • •</span></>}</div>
    {!unlocked && <span className="badge-lock"><Lock className="h-3 w-3" /></span>}
  </div>;
}