import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BadgeState, City, Experience } from '@/data/contracts';

const mocks = vi.hoisted(() => ({ update: vi.fn(), create: vi.fn(), slot: vi.fn(), media: vi.fn(), upload: vi.fn(), caption: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/data/backend', () => ({ updateExperience: mocks.update, createExperience: mocks.create, setFeaturedSlot: mocks.slot, fetchMedia: mocks.media, uploadMedia: mocks.upload, updateMediaCaption: mocks.caption }));
vi.mock('@tanstack/react-router', () => ({ useBlocker: vi.fn(), useNavigate: () => vi.fn() }));
vi.mock('@/lib/experience-queries', () => ({ refreshExperiences: vi.fn(), removeExperience: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
import { ExperienceEditor } from './ExperienceEditor';
import { FeaturedSlots } from './FeaturedSlots';
import { MediaGallery } from './MediaGallery';

const city: City = { id: 'fixture-city', istat_code: 'city:fixture', official_istat_code: null, name: 'Fixture', slug: 'fixture', province_code: 'p', region_code: 'r', coat_of_arms_url: null };
const item: Experience = { id: 'fixture-exp', city_id: city.id, istat_code: city.istat_code, user_id: 'fixture-owner', title: 'Fixture', visit_date: null, notes: null, created_at: '2026-11-01', updated_at: '2026-11-01', legacy_source_key: null, deleting: false };
const badges: BadgeState = { earned: [{ badge_id: 'prima-impronta', earned_at: '2026-11-01' }], featured: [], metrics: { cities: 1, regions: 1, memories: 0 } };
let client: QueryClient;
function mount(node: React.ReactNode) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}
describe('accessible feedback and Radix modals with isolated fixtures', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.media.mockResolvedValue([]); });
  afterEach(() => { cleanup(); client?.clear(); });
  it('announces saving then success, retaining a missing date as null', async () => {
    let finish: () => void = () => {};
    mocks.update.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    mount(<ExperienceEditor userId="fixture-owner" city={city} item={item} visited />);
    fireEvent.change(screen.getByLabelText('Titolo dell’esperienza'), { target: { value: 'Modificato' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva esperienza' }));
    expect(screen.getByRole('status')).toHaveTextContent('Salvataggio in corso');
    expect(screen.getByRole('button', { name: 'Salva esperienza' })).toBeDisabled();
    finish(); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Salvato'));
    expect(mocks.update).toHaveBeenCalledWith('fixture-owner', 'fixture-exp', { title: 'Modificato', visit_date: null, notes: null });
  });
  it('announces save failure and leaves the draft available for retry', async () => {
    mocks.update.mockRejectedValue(new Error('private details'));
    mount(<ExperienceEditor userId="fixture-owner" city={city} item={item} visited />);
    fireEvent.change(screen.getByLabelText('Note personali'), { target: { value: 'Bozza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva esperienza' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Salvataggio non riuscito');
    expect(screen.getByLabelText('Note personali')).toHaveValue('Bozza');
    expect(screen.getByRole('button', { name: 'Salva esperienza' })).not.toBeDisabled();
  });
  it('opens a named showcase dialog with focus inside and Escape closes it without writes', async () => {
    mount(<FeaturedSlots userId="fixture-owner" data={badges} />);
    const trigger = screen.getByRole('button', { name: 'Gestisci spazio 3' }); trigger.focus(); fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Scegli una conquista' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.slot).not.toHaveBeenCalled();
  });
  it('writes the selected earned badge to the exact empty slot without changing fixture positions', async () => {
    mocks.slot.mockResolvedValue(undefined);
    mount(<FeaturedSlots userId="fixture-owner" data={badges} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gestisci spazio 2' }));
    fireEvent.click(await screen.findByRole('button', { name: /Prima impronta/ }));
    await waitFor(() => expect(mocks.slot).toHaveBeenCalledWith(2, 'prima-impronta'));
    expect(badges.featured).toEqual([]);
  });
  it('opens a labelled caption field and Escape makes no saving request', async () => {
    mocks.media.mockResolvedValue([{ id: 'fixture-photo', user_id: 'fixture-owner', istat_code: city.istat_code, experience_id: item.id, file_name: 'fixture.png', media_type: 'photo', url: 'data:image/png;base64,', caption: null, created_at: '2026-11-01', storage_path: 'fixture-owner/city:fixture/fixture.png', is_cover: false }]);
    mount(<MediaGallery userId="fixture-owner" istat={city.istat_code} experienceId={item.id} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Modifica didascalia' }));
    expect(await screen.findByRole('textbox', { name: 'Didascalia' })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.caption).not.toHaveBeenCalled();
  });
});