import type { diaryEntries } from "./diary";

export type DiaryEntry = ReturnType<typeof diaryEntries>[number];
export type DiaryMode = "album" | "timeline";
export const diaryModeKey = (userId: string) => `italia-explorer:diary-mode:${userId}`;

export function timelineEntries(entries: DiaryEntry[], year = "", ascending = false) {
  return entries.filter(e => !year || e.visit.visit_date?.slice(0, 4) === year).sort((a, b) => {
    const ad = a.visit.visit_date;
    const bd = b.visit.visit_date;
    if (!ad && bd) return 1;
    if (ad && !bd) return -1;
    const order = (ad ?? "").localeCompare(bd ?? "");
    return (ascending ? order : -order) || a.city.name.localeCompare(b.city.name, "it") || a.visit.id.localeCompare(b.visit.id);
  });
}

export function timelineGroups(entries: DiaryEntry[]) {
  const groups = new Map<string, { key: string; year: string; month: string; entries: DiaryEntry[] }>();
  for (const entry of entries) {
    const date = entry.visit.visit_date;
    const key = date?.slice(0, 7) ?? "undated";
    let group = groups.get(key);
    if (!group) {
      group = { key, year: date?.slice(0, 4) ?? "", month: date ? new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", { month: "long" }) : "Data non indicata", entries: [] };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}