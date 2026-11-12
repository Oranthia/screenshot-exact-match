import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { allowLocalDemo } from '../../scripts/demo-policy';
import { localDemoPlugin } from '../../scripts/demo-plugin';
import { demoState, DEMO_OWNER, resetDemo, setDemoFailure } from './state';
import * as demo from './adapter';
import { experienceAlbum, experienceTimeline } from '@/lib/experiences';
import { computeProgress } from '@/lib/progress';

describe('development-only demo activation', () => {
  it('requires explicit flag and loopback development server', () => {
    expect(allowLocalDemo('serve', 'development', '1', 'localhost')).toBe(true);
    expect(allowLocalDemo('serve', 'development', undefined, 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'development', 'true', 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'development', '1', 'example.org')).toBe(false);
  });
  it('never enables demo in any production or development build', () => {
    expect(allowLocalDemo('build', 'production', '1', 'localhost')).toBe(false);
    expect(allowLocalDemo('build', 'development', '1', 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'production', '1', 'localhost')).toBe(false);
  });
  it('fails closed if a demo build is attempted and leaves normal configuration unchanged', () => {
    const hook = localDemoPlugin().config;
    if (typeof hook !== 'function') throw new Error('config hook required');
    vi.stubEnv('ITALIA_LOCAL_DEMO', '1');
    expect(() => hook.call({} as never, {}, { command: 'build', mode: 'production' })).toThrow('serve/development only');
    vi.stubEnv('ITALIA_LOCAL_DEMO', '');
    expect(hook.call({} as never, {}, { command: 'build', mode: 'production' })).toBeUndefined();
    vi.unstubAllEnvs();
  });
  it('has no runtime imports or calls to the real adapters, client or network', () => {
    for (const name of ['adapter.ts', 'state.ts', 'controls.tsx']) {
      const source = readFileSync(`src/demo/${name}`, 'utf8');
      expect(source).not.toMatch(/import(?!\s+type\b)[^\n]*from ['"](?:@\/data\/backend|.*integrations\/|@supabase\/)/);
      expect(source).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
    }
  });
});
describe('synthetic scenarios and isolated mutations', () => {
  beforeEach(() => resetDemo('B'));
  it('scenario A has zero visits, empty diary and no badges', async () => {
    resetDemo('A'); const s = demoState();
    expect((await demo.fetchVisits(DEMO_OWNER))).toEqual([]);
    expect(experienceAlbum(s.cities, s.visits, s.experiences, { q: '', region: '', sort: 'date' })).toEqual([]);
    expect((await demo.syncBadges()).earned).toEqual([]);
  });
  it('scenario C has three experiences but only one city in Album and progress', () => {
    resetDemo('C'); const s = demoState();
    expect(s.experiences).toHaveLength(3);
    expect(experienceAlbum(s.cities, s.visits, s.experiences, { q: '', region: '', sort: 'date' })).toHaveLength(1);
    expect(experienceTimeline(s.cities, s.visits, s.experiences, { q: '', region: '', year: '', sort: 'date' })).toHaveLength(3);
    expect(computeProgress(s.regions, s.cities, new Set(s.visits.map(v => v.istat_code))).national.visited).toBe(1);
    expect(s.experiences.filter(e => e.visit_date === null)).toHaveLength(1);
  });
  it('OFF retains all memories and ON restores unique progress', async () => {
    resetDemo('C'); const s = demoState(); const before = structuredClone(s.experiences);
    await demo.saveVisit(DEMO_OWNER, { istat_code: 'demo:venezia', visited: false });
    expect(s.experiences).toEqual(before); expect((await demo.syncBadges()).metrics.cities).toBe(0);
    await demo.saveVisit(DEMO_OWNER, { istat_code: 'demo:venezia', visited: true });
    expect((await demo.syncBadges()).metrics.cities).toBe(1);
  });
  it('creates only after OFF confirmation and does not inflate repeat journeys', async () => {
    resetDemo('A'); const draft = { title: 'DEMO · Prova', visit_date: null, notes: null };
    await expect(demo.createExperience('demo-city-venezia', draft, false)).rejects.toThrow('Conferma OFF');
    await demo.createExperience('demo-city-venezia', draft, true);
    await demo.createExperience('demo-city-venezia', draft, false);
    expect(demoState().experiences).toHaveLength(2); expect((await demo.syncBadges()).metrics.cities).toBe(1);
  });
  it('edits and deletes only the selected experience while retaining ON and siblings', async () => {
    resetDemo('C'); const s = demoState(); const first = s.experiences[0]; const sibling = s.experiences[1];
    if (!first || !sibling) throw new Error('fixture missing'); const untouched = structuredClone(sibling);
    await demo.updateExperience(DEMO_OWNER, first.id, { title: 'DEMO · Modificato', visit_date: null, notes: 'Nota nuova' });
    expect(s.experiences[0]?.visit_date).toBeNull(); expect(s.experiences[1]).toEqual(untouched);
    await demo.removeExperience(DEMO_OWNER, first.id);
    expect(s.experiences).toHaveLength(2); expect(s.media.some(m => m.experience_id === first.id)).toBe(false);
    expect(s.visits[0]?.visited).toBe(true);
  });
  it('simulates load/save failure without losing stored demo values and allows retry', async () => {
    resetDemo('D'); const before = structuredClone(demoState().experiences);
    await expect(demo.fetchCatalog()).rejects.toThrow('simulato');
    await expect(demo.saveVisit(DEMO_OWNER, { istat_code: 'demo:venezia', visited: false })).rejects.toThrow('simulato');
    expect(demoState().experiences).toEqual(before);
    expect(demoState().media[0]?.url).toBe('/__demo/missing-photo.jpg');
    setDemoFailure('load', false); expect((await demo.fetchCatalog()).cities).toHaveLength(6);
  });
  it('uses existing badge thresholds and swaps exact slots without duplicates', async () => {
    const s = await demo.syncBadges(); expect(s.earned.map(b => b.badge_id)).toEqual(['prima-impronta', 'tre-terre', 'primo-ricordo']);
    expect(s.featured).toHaveLength(3);
    await demo.setFeaturedSlot(3, 'prima-impronta');
    expect(demoState().badges.featured).toContainEqual({ badge_id: 'prima-impronta', position: 3 });
    expect(demoState().badges.featured).toContainEqual({ badge_id: 'primo-ricordo', position: 1 });
    await expect(demo.setFeaturedSlot(2, 'cento-orizzonti')).rejects.toThrow('non ottenuta');
  });
  it('rejects non-demo identities and returns copies, not mutable shared rows', async () => {
    await expect(demo.fetchVisits('real-account')).rejects.toThrow('rifiutata');
    const rows = await demo.fetchVisits(DEMO_OWNER); if (rows[0]) rows[0].visited = false;
    expect(demoState().visits.every(v => v.visited)).toBe(true);
    expect((await demo.getSession())?.access_token).toBe('');
  });
  it('scenario reset discards drafts, temporary changes and prior errors', async () => {
    await demo.saveVisit(DEMO_OWNER, { istat_code: 'demo:siena', visited: true }); resetDemo('A');
    expect(demoState().visits).toEqual([]); expect(demoState().failures).toEqual({ load: false, save: false });
    resetDemo('C'); expect(demoState().experiences).toHaveLength(3);
  });
  it('keeps demo geography as a verified subset of the existing catalog', () => {
    const source = JSON.parse(readFileSync('scripts/data/initial-cities.json', 'utf8')).cities;
    for (const c of demoState().cities) expect(source.some((r: { name: string; region_code: string }) => r.name === c.name && r.region_code === c.region_code)).toBe(true);
  });
});