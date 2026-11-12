import type { BadgeState, City, Experience, Province, Region, SignedMedia, Visit } from '@/data/contracts';
import { eligibleBadges } from '@/lib/badges';
import { computeProgress } from '@/lib/progress';
import catalog from './catalog.json';
import photo from './assets/demo-piazza.jpg';

export type Scenario = 'A' | 'B' | 'C' | 'D';
export const DEMO_OWNER = 'demo-isolated-owner';
export const DEMO_DATE = '2026-01-15T12:00:00Z';
export interface DemoState {
  scenario: Scenario; regions: Region[]; provinces: Province[]; cities: City[];
  visits: Visit[]; experiences: Experience[]; media: SignedMedia[]; badges: BadgeState;
  failures: { load: boolean; save: boolean }; name: string; signedIn: boolean; sequence: number;
}
export function makeScenario(scenario: Scenario): DemoState {
  const regions = [{ code: '01', name: 'Piemonte', slug: 'piemonte' }, { code: '05', name: 'Veneto', slug: 'veneto' }, { code: '09', name: 'Toscana', slug: 'toscana' }];
  const cities: City[] = catalog.map(r => ({ id: `demo-city-${r.name.toLowerCase()}`, istat_code: `demo:${r.name.toLowerCase()}`, official_istat_code: null, name: r.name, slug: r.name.toLowerCase(), province_code: r.province_code, region_code: r.region_code, coat_of_arms_url: null }));
  const provinces: Province[] = catalog.map(r => ({ code: r.province_code, name: r.province_name, abbreviation: r.abbreviation, region_code: r.region_code }));
  const selected = scenario === 'A' ? [] : scenario === 'C' || scenario === 'D' ? cities.filter(c => c.name === 'Venezia') : cities.filter(c => ['Torino', 'Venezia', 'Firenze'].includes(c.name));
  const visits: Visit[] = selected.map(c => ({ id: `demo-visit-${c.slug}`, user_id: DEMO_OWNER, istat_code: c.istat_code, visited: true, visit_date: null, notes: null, updated_at: DEMO_DATE }));
  const experiences: Experience[] = selected.flatMap(c => Array.from({ length: c.name === 'Venezia' && (scenario === 'B' || scenario === 'C') ? 3 : 1 }, (_, i) => ({ id: `demo-experience-${c.slug}-${i}`, user_id: DEMO_OWNER, city_id: c.id, istat_code: c.istat_code, title: `DEMO · ${c.name} · Viaggio ${i + 1}`, visit_date: i === 2 ? null : i === 0 ? '2025-06-10' : '2024-04-03', notes: `Nota fittizia indipendente ${i + 1}. Nessun ricordo personale.`, created_at: DEMO_DATE, updated_at: DEMO_DATE, legacy_source_key: null, deleting: false })));
  const media: SignedMedia[] = experiences.filter((_, i) => i % 2 === 0).map(e => ({ id: `demo-media-${e.id}`, user_id: DEMO_OWNER, istat_code: e.istat_code, experience_id: e.id, file_name: 'demo-piazza.jpg', media_type: 'photo', storage_path: `demo-local/${e.id}`, url: scenario === 'D' ? '/__demo/missing-photo.jpg' : photo, caption: 'Immagine sintetica dimostrativa, non una fotografia della città.', created_at: DEMO_DATE, is_cover: true }));
  const state: DemoState = { scenario, regions, provinces, cities, visits, experiences, media, badges: { earned: [], featured: [], metrics: { cities: 0, regions: 0, memories: 0 } }, failures: { load: scenario === 'D', save: scenario === 'D' }, name: 'Viaggiatore DEMO', signedIn: true, sequence: 0 };
  evaluateBadges(state);
  if (scenario === 'B') state.badges.featured = state.badges.earned.slice(0, 3).map((b, i) => ({ badge_id: b.badge_id, position: i + 1 }));
  return state;
}
export function evaluateBadges(state: DemoState) {
  const on = new Set(state.visits.filter(v => v.visited).map(v => v.istat_code));
  const progress = computeProgress(state.regions, state.cities, on);
  const memories = new Set(state.media.filter(m => on.has(m.istat_code)).map(m => m.istat_code)).size;
  const metrics = { cities: progress.national.visited, regions: progress.regionsExplored, memories };
  for (const id of eligibleBadges(metrics)) if (!state.badges.earned.some(b => b.badge_id === id)) state.badges.earned.push({ badge_id: id, earned_at: DEMO_DATE });
  state.badges.metrics = metrics;
}
let current: DemoState | undefined;
const listeners = new Set<() => void>();
export function demoState() { return current ?? (current = makeScenario('B')); }
export function subscribeDemo(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function announceDemo() { for (const listener of listeners) listener(); }
export function resetDemo(scenario: Scenario) {
  for (const m of current?.media ?? []) if (m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
  current = makeScenario(scenario); announceDemo();
}
export function setDemoFailure(kind: 'load' | 'save', enabled: boolean) { demoState().failures[kind] = enabled; announceDemo(); }
export function checkDemo(kind: 'load' | 'save') { if (demoState().failures[kind]) throw new Error(`DEMO · Errore di ${kind === 'load' ? 'caricamento' : 'salvataggio'} simulato`); }
export const copyDemo = <T,>(value: T): T => structuredClone(value);