import type { Municipality, Visit } from './queries';
import { diaryEntries, normalizeCityName, type DiarySort } from './diary';
import type { Experience } from '@/data/contracts';
export type { Experience };
export const experienceTitle = (title: string) => title.trim() || 'Ricordo di viaggio';
export function sortExperiences(rows: Experience[], ascending = false) {
  return [...rows].sort((a,b) => !a.visit_date && b.visit_date ? 1 : a.visit_date && !b.visit_date ? -1 : (ascending ? 1 : -1) * (a.visit_date ?? '').localeCompare(b.visit_date ?? '') || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
}
export function experienceAlbum(cities: Municipality[], visits: Visit[], experiences: Experience[], filters: {q:string;region:string;sort:DiarySort}) {
  const byCity = new Map<string, Experience[]>();
  for (const item of sortExperiences(experiences.filter(e => !e.deleting))) byCity.set(item.istat_code,[...(byCity.get(item.istat_code) ?? []),item]);
  const summaries = visits.map(v => { const latest = byCity.get(v.istat_code)?.[0]; return {...v, visit_date: latest?.visit_date ?? null, notes: latest?.notes ?? null}; });
  return diaryEntries(cities,summaries,filters).map(e => ({...e, experienceCount:byCity.get(e.city.istat_code)?.length ?? 0}));
}
export function experienceTimeline(cities: Municipality[], visits: Visit[], experiences: Experience[], filters: {q:string;region:string;year:string;sort:DiarySort}) {
  const visited = new Set(visits.filter(v => v.visited).map(v => v.istat_code));
  const geo = new Map(cities.map(c => [c.istat_code,c]));
  const q = normalizeCityName(filters.q.trim());
  return sortExperiences(experiences,filters.sort === 'date-asc').flatMap(experience => {
    const city = geo.get(experience.istat_code);
    return !experience.deleting && city && visited.has(city.istat_code) && (!filters.region || city.region_code === filters.region) && normalizeCityName(city.name).includes(q) && (!filters.year || experience.visit_date?.slice(0,4) === filters.year) ? [{city,experience}] : [];
  });
}
export function experienceGroups(entries: ReturnType<typeof experienceTimeline>) {
  const groups = new Map<string,{key:string;year:string;month:string;entries:typeof entries}>();
  for (const entry of entries) {
    const date = entry.experience.visit_date; const key = date?.slice(0,7) ?? 'undated';
    const group = groups.get(key) ?? {key,year:date?.slice(0,4) ?? '',month:date ? new Date(`${date}T12:00:00`).toLocaleDateString('it-IT',{month:'long'}) : 'Data non indicata',entries:[]};
    group.entries.push(entry); groups.set(key,group);
  }
  return [...groups.values()];
}
