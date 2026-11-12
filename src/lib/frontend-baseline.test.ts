import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { optimisticVisit } from './visit-cache';
import { experienceAlbum, experienceTimeline, type Experience } from './experiences';
import { firstDiaryPhotos } from './diary';
import type { Municipality, Visit, VisitMedia } from './queries';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
const city: Municipality = { id: 'c', istat_code: 'city:fixture', name: 'Fixture', slug: 'fixture', province_code: 'p', region_code: 'r', official_istat_code: null, coat_of_arms_url: null };
const visit: Visit = { id: 'v', user_id: 'owner', istat_code: city.istat_code, visited: true, visit_date: null, notes: null, updated_at: '2026-11-05' };
const experience = (id: string): Experience => ({ id, user_id: 'owner', city_id: city.id, istat_code: city.istat_code, title: id, visit_date: null, notes: `note ${id}`, created_at: '2026-11-05', updated_at: '2026-11-05', legacy_source_key: null, deleting: false });
const media = (id: string, experience_id: string, media_type = 'photo', is_cover = false): VisitMedia => ({ id, experience_id, media_type, is_cover, user_id: 'owner', istat_code: city.istat_code, file_name: `${id}.fixture`, storage_path: `owner/${city.istat_code}/${id}`, caption: null, created_at: `2026-11-0${id === 'first' ? 1 : 2}` });
describe('cross-feature frontend baseline', () => {
  it('OFF/ON changes only visits cache, keeping independent experiences and photo/video references', () => {
    const qc = new QueryClient();
    const experiences = [experience('A'), experience('B')]; const files = [media('first', 'A'), media('video', 'B', 'video')];
    qc.setQueryData(['experiences', 'owner'], experiences); qc.setQueryData(['media', 'owner'], files);
    const off = optimisticVisit([visit], 'owner', { istat_code: city.istat_code, visited: false });
    qc.setQueryData(['visits', 'owner'], off);
    const filters = { q: '', region: '', year: '', sort: 'date' as const };
    expect(experienceTimeline([city], off, experiences, filters)).toEqual([]);
    const on = optimisticVisit(off, 'owner', { istat_code: city.istat_code, visited: true });
    expect(experienceTimeline([city], on, experiences, filters).map(e => e.experience.id)).toEqual(['A', 'B']);
    expect(qc.getQueryData(['experiences', 'owner'])).toEqual(experiences);
    expect(qc.getQueryData(['media', 'owner'])).toEqual(files);
    expect(on).toEqual([visit]);
  });
  it('keeps a visited city in Album independently of zero, many or deleting experiences', () => {
    const filters = { q: '', region: '', sort: 'date' as const };
    for (const rows of [[], [experience('A'), experience('B')], [{ ...experience('A'), deleting: true }]]) {
      expect(experienceAlbum([city], [visit], rows, filters).map(e => e.city.id)).toEqual(['c']);
    }
    expect(experienceAlbum([city], [{ ...visit, visited: false }], [experience('A')], filters)).toEqual([]);
  });
  it('uses selected city photo across experiences and falls back to remaining photo, never video', () => {
    const rows = [media('first', 'A'), media('selected', 'B', 'photo', true), media('video', 'B', 'video')];
    expect(firstDiaryPhotos(rows).map(p => [p.id, p.experience_id, p.storage_path])).toEqual([['selected', 'B', `owner/${city.istat_code}/selected`]]);
    expect(firstDiaryPhotos(rows.filter(p => p.experience_id !== 'B')).map(p => p.id)).toEqual(['first']);
    expect(firstDiaryPhotos([media('video', 'B', 'video', true)])).toEqual([]);
    expect(rows.map(p => p.experience_id)).toEqual(['A', 'B', 'B']);
  });
});