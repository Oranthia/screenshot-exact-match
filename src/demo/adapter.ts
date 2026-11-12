// Never imported by the production graph; the local Vite plugin substitutes the real barrel.
import type { Session } from '@supabase/supabase-js';
import type { ExperienceDraft, Media, MediaKind, UserProfile, VisitPatch } from '@/data/contracts';
import { firstDiaryPhotos } from '@/lib/diary';
import { validateFeatured } from '@/lib/badges';
import { validateFeaturedSlot } from '@/lib/featured-slot';
import { experienceTitle } from '@/lib/experiences';
import { announceDemo, checkDemo, copyDemo, DEMO_DATE, DEMO_OWNER, demoState, evaluateBadges, subscribeDemo } from './state';

export type AuthSession = Session;
function owner(userId: string) { if (userId !== DEMO_OWNER) throw new Error('DEMO · Identità non dimostrativa rifiutata'); }
function nextId(prefix: string) { return `demo-${prefix}-${++demoState().sequence}`; }
export async function fetchCatalog() { checkDemo('load'); const s = demoState(); return copyDemo({ regions: s.regions, provinces: s.provinces, cities: s.cities, catalogComplete: false, nationalTotal: s.cities.length }); }
export async function fetchVisits(userId: string) { owner(userId); checkDemo('load'); return copyDemo(demoState().visits); }
export async function saveVisit(userId: string, patch: VisitPatch) {
  owner(userId); checkDemo('save'); const s = demoState();
  if (!s.cities.some(c => c.istat_code === patch.istat_code)) throw new Error('DEMO · Città sconosciuta');
  let row = s.visits.find(v => v.istat_code === patch.istat_code);
  if (!row) { row = { id: nextId('visit'), user_id: DEMO_OWNER, istat_code: patch.istat_code, visited: false, visit_date: null, notes: null, updated_at: DEMO_DATE }; s.visits.push(row); }
  if (patch.visited !== undefined) row.visited = patch.visited;
  row.updated_at = DEMO_DATE; evaluateBadges(s); return copyDemo(row);
}
export async function fetchExperiences(userId: string) { owner(userId); checkDemo('load'); return copyDemo(demoState().experiences); }
export async function createExperience(cityId: string, draft: ExperienceDraft, confirmVisit: boolean) {
  checkDemo('save'); const s = demoState(); const city = s.cities.find(c => c.id === cityId);
  if (!city) throw new Error('DEMO · Città sconosciuta');
  if (!s.visits.some(v => v.istat_code === city.istat_code && v.visited) && !confirmVisit) throw new Error('DEMO · Conferma OFF richiesta');
  await saveVisit(DEMO_OWNER, { istat_code: city.istat_code, visited: true });
  const row = { id: nextId('experience'), user_id: DEMO_OWNER, city_id: city.id, istat_code: city.istat_code, ...draft, title: experienceTitle(draft.title), created_at: DEMO_DATE, updated_at: DEMO_DATE, legacy_source_key: null, deleting: false };
  s.experiences.push(row); return copyDemo(row);
}
export async function updateExperience(userId: string, id: string, draft: ExperienceDraft) {
  owner(userId); checkDemo('save'); const row = demoState().experiences.find(e => e.id === id && !e.deleting);
  if (!row) throw new Error('DEMO · Esperienza assente'); Object.assign(row, draft, { title: experienceTitle(draft.title), updated_at: DEMO_DATE });
}
export async function removeExperience(userId: string, id: string) {
  owner(userId); checkDemo('save'); const s = demoState();
  for (const m of s.media.filter(m => m.experience_id === id)) if (m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
  s.media = s.media.filter(m => m.experience_id !== id); s.experiences = s.experiences.filter(e => e.id !== id); evaluateBadges(s);
}
export async function fetchMedia(userId: string, istat: string, experienceId?: string) { owner(userId); checkDemo('load'); return copyDemo(demoState().media.filter(m => m.istat_code === istat && (!experienceId || m.experience_id === experienceId))); }
export async function fetchDiaryPhotos(userId: string, codes: string[]) { owner(userId); checkDemo('load'); return copyDemo(firstDiaryPhotos(demoState().media.filter(m => codes.includes(m.istat_code)))); }
export async function fetchExperiencePreviews(userId: string, ids: string[]) {
  owner(userId); checkDemo('load'); return ids.map(id => { const rows = demoState().media.filter(m => m.experience_id === id); return copyDemo({ id, photos: rows.filter(m => m.media_type === 'photo').length, videos: rows.filter(m => m.media_type === 'video').length, photo: rows.find(m => m.media_type === 'photo') }); });
}
export async function uploadMedia(input: { userId: string; istat: string; experienceId: string; file: File; kind: MediaKind; contentType: string }) {
  owner(input.userId); checkDemo('save'); const s = demoState();
  if (!s.experiences.some(e => e.id === input.experienceId && e.istat_code === input.istat)) throw new Error('DEMO · Riferimento media non valido');
  s.media.push({ id: nextId('media'), user_id: DEMO_OWNER, istat_code: input.istat, experience_id: input.experienceId, file_name: `DEMO · ${input.file.name}`, media_type: input.kind, storage_path: 'demo-local/browser-only', caption: 'DEMO · File temporaneo nel browser, non caricato online', url: URL.createObjectURL(input.file), created_at: DEMO_DATE, is_cover: false }); evaluateBadges(s);
}
export async function updateMediaCaption(id: string, caption: string | null) { checkDemo('save'); const row = demoState().media.find(m => m.id === id); if (row) row.caption = caption; }
export async function setCityCover(id: string) { checkDemo('save'); const s = demoState(); const row = s.media.find(m => m.id === id && m.media_type === 'photo'); if (!row) throw new Error('DEMO · Copertina non valida'); for (const m of s.media) if (m.istat_code === row.istat_code) m.is_cover = m.id === id; }
export async function deleteMedia(item: Pick<Media, 'id' | 'storage_path'>): Promise<'file' | 'record' | null> { checkDemo('save'); const s = demoState(); const row = s.media.find(m => m.id === item.id); if (row?.url.startsWith('blob:')) URL.revokeObjectURL(row.url); s.media = s.media.filter(m => m.id !== item.id); evaluateBadges(s); return null; }
export async function syncBadges() { checkDemo('load'); evaluateBadges(demoState()); return copyDemo(demoState().badges); }
export async function setFeaturedBadges(ids: string[]) { checkDemo('save'); const s = demoState(); validateFeatured(ids, s.badges.earned.map(b => b.badge_id)); s.badges.featured = ids.map((badge_id, i) => ({ badge_id, position: i + 1 })); }
export async function setFeaturedSlot(position: number, badgeId: string | null) {
  checkDemo('save'); const s = demoState(); validateFeaturedSlot(position, badgeId, s.badges);
  const existing = s.badges.featured.find(f => f.badge_id === badgeId); const replaced = s.badges.featured.find(f => f.position === position);
  const from = existing?.position; s.badges.featured = s.badges.featured.filter(f => f.position !== position && f.badge_id !== badgeId);
  if (badgeId) s.badges.featured.push({ badge_id: badgeId, position });
  if (from && from !== position && replaced) s.badges.featured.push({ badge_id: replaced.badge_id, position: from });
  s.badges.featured.sort((a, b) => a.position - b.position);
}
export async function getSession(): Promise<AuthSession | null> {
  const s = demoState(); if (!s.signedIn) return null;
  return { access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer', user: { id: DEMO_OWNER, aud: 'demo-local', email: 'demo@example.invalid', app_metadata: {}, user_metadata: { display_name: s.name }, created_at: DEMO_DATE } };
}
export function toProfile(session: Pick<AuthSession, 'user'> | null): UserProfile | null { return session ? { id: session.user.id, email: session.user.email ?? null, displayName: session.user.user_metadata['display_name'] ?? null } : null; }
export function onAuthChange(cb: (event: string, session: AuthSession | null) => void) { return subscribeDemo(() => { void getSession().then(s => cb(s ? 'USER_UPDATED' : 'SIGNED_OUT', s)); }); }
export async function signIn(_email: string, _password: string) { demoState().signedIn = true; announceDemo(); }
export async function signUp(_email: string, _password: string, _redirect: string) { await signIn('', ''); return true; }
export async function signOut() { demoState().signedIn = false; announceDemo(); }
export async function updateDisplayName(name: string) { checkDemo('save'); demoState().name = name; announceDemo(); }