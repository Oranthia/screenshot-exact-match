import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Region } from "@/lib/queries";
import { type DiaryEntry } from "@/lib/diary-timeline";
import { experienceGroups, type experienceTimeline } from "@/lib/experiences";
import { DiaryCover } from "./DiaryCover";
import { Crest } from "./Crest";

type Photo = { id: string; url: string; caption: string | null };
type Props = { entries: (DiaryEntry & { experienceCount?: number })[]; regions: Map<string, Region>; photos: Map<string, Photo>; pending: boolean; retry: () => void };
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

export function DiaryAlbum({ entries, regions, photos, pending, retry }: Props) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{entries.map(({ city, visit, experienceCount }) => <Link key={visit.id} to="/comune/$slug" params={{ slug: city.slug }} className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-lift">
    <DiaryCover name={city.name} coatUrl={city.coat_of_arms_url} photo={photos.get(city.istat_code)} pending={pending} onRetry={retry} />
    <div className="p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{city.name}</h2><p className="text-sm text-muted-foreground">{regions.get(city.region_code)?.name}</p></div>{city.coat_of_arms_url && <Crest name={city.name} url={city.coat_of_arms_url} visited />}</div>{experienceCount !== undefined && <p className="mt-2 text-xs text-muted-foreground">{experienceCount} {experienceCount === 1 ? "esperienza registrata" : "esperienze registrate"}</p>}{visit.visit_date && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays aria-hidden className="h-3.5 w-3.5 shrink-0" />{dateLabel(visit.visit_date)}</p>}{visit.notes?.trim() && <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-foreground/85">{visit.notes}</p>}</div>
  </Link>)}</div>;
}

export function DiaryTimeline({ entries, regions, photos, pending, retry }: Omit<Props, "entries"> & { entries: ReturnType<typeof experienceTimeline> }) {
  const groups = experienceGroups(entries);
  return <div className="space-y-7">{groups.map((group, index) => <section key={group.key} className="space-y-4" aria-label={group.year ? `${group.month} ${group.year}` : group.month}>
    {group.year && groups[index - 1]?.year !== group.year && <h2 className="text-3xl font-semibold text-primary">{group.year}</h2>}
    <h3 className="font-sans text-xs font-semibold uppercase text-muted-foreground">{group.month}</h3>
    <ol className="ml-2 space-y-2 border-l border-primary/25 pl-4">{group.entries.map(({ city, experience }) => <li key={experience.id} className="relative"><span aria-hidden className="absolute -left-[21px] top-8 h-2 w-2 rounded-full border border-background bg-primary" />
      <Link to="/esperienza/$id" params={{ id: experience.id }} className="flex min-w-0 items-center gap-3 rounded-lg py-3 transition-colors hover:bg-secondary/60" aria-label={`Apri ${experience.title}`}>
        <DiaryCover compact name={city.name} coatUrl={city.coat_of_arms_url} photo={photos.get(experience.id)} pending={pending} onRetry={retry} />
        <div className="min-w-0 flex-1">{experience.visit_date && <time dateTime={experience.visit_date} className="text-xs text-muted-foreground">{dateLabel(experience.visit_date)}</time>}<h3 className="break-words text-xl font-semibold leading-tight">{experience.title}</h3><p className="text-xs text-muted-foreground">{city.name} · {regions.get(city.region_code)?.name}</p></div><ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-primary" />
      </Link>
    </li>)}</ol>
  </section>)}</div>;
}