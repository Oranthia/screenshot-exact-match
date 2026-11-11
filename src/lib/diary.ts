import type { Municipality, Visit, VisitMedia } from "./queries";

export const normalizeCityName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it");

export type DiarySort = "date" | "date-asc" | "name" | "name-desc";

export function diaryEntries(cities: Municipality[], visits: Visit[], filters: { q: string; region: string; sort: DiarySort }) {
  const visited = new Map(visits.filter(v => v.visited).map(v => [v.istat_code, v]));
  const term = normalizeCityName(filters.q.trim());
  return cities.flatMap(city => {
    const visit = visited.get(city.istat_code);
    return visit && (!filters.region || city.region_code === filters.region) && normalizeCityName(city.name).includes(term)
      ? [{ city, visit }] : [];
  }).sort((a, b) => {
    if (filters.sort === "date" || filters.sort === "date-asc") {
      // No creation timestamp exists in the current visit schema. Use the real
      // last-saved timestamp for ordering only, never as a displayed visit date.
      const aDate = a.visit.visit_date ? `${a.visit.visit_date}T00:00:00` : a.visit.updated_at ?? "";
      const bDate = b.visit.visit_date ? `${b.visit.visit_date}T00:00:00` : b.visit.updated_at ?? "";
      const dateOrder = filters.sort === "date-asc" ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
      if (dateOrder) return dateOrder;
    }
    const nameOrder = a.city.name.localeCompare(b.city.name, "it");
    return (filters.sort === "name-desc" ? -nameOrder : nameOrder) || a.city.istat_code.localeCompare(b.city.istat_code);
  });
}

export function firstDiaryPhotos(rows: VisitMedia[]) {
  const first = new Map<string, VisitMedia>();
  for (const row of [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))) {
    if (row.media_type === "photo" && !first.has(row.istat_code)) first.set(row.istat_code, row);
  }
  return [...first.values()];
}