import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Municipality } from '@/lib/queries';
import type { Experience } from '@/lib/experiences';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), navigate: vi.fn(), refresh: vi.fn(), remove: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
vi.mock('@tanstack/react-router', () => ({ useBlocker: vi.fn(), useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
vi.mock('@/lib/experience-queries', () => ({ refreshExperiences: mocks.refresh, removeExperience: mocks.remove }));
vi.mock('./MediaGallery', () => ({ MediaGallery: () => null }));
import { ExperienceEditor } from './ExperienceEditor';

const city: Municipality = { id: 'fixture-city', istat_code: 'city:fixture', name: 'Città fixture', slug: 'fixture', province_code: 'p', region_code: 'r', coat_of_arms_url: null, official_istat_code: null };
const experience = (id: string): Experience => ({ id, city_id: city.id, istat_code: city.istat_code, user_id: 'fixture-owner', title: id, visit_date: '2026-11-05', notes: `note ${id}`, created_at: '2026-11-05', updated_at: '2026-11-05', legacy_source_key: null, deleting: false });
describe('experience editor operation boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.navigate.mockResolvedValue(undefined); });
  afterEach(cleanup);
  it('requires explicit confirmation for an OFF city and sends one atomic creation request', async () => {
    mocks.rpc.mockResolvedValue({ data: experience('created'), error: null });
    render(<ExperienceEditor city={city} userId="fixture-owner" visited={false} />);
    fireEvent.change(screen.getByLabelText('Titolo dell’esperienza'), { target: { value: 'Secondo viaggio' } });
    fireEvent.click(screen.getByRole('button', { name: /^Crea esperienza$/ }));
    expect(mocks.rpc).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Conferma e salva' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('create_my_experience', { _city_id: 'fixture-city', _title: 'Secondo viaggio', _visit_date: null, _notes: null, _confirm_visit: true });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('updates only the selected owner experience and leaves sibling fixture unchanged', async () => {
    const selected = experience('A'); const sibling = Object.freeze(experience('B'));
    const single = vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null });
    const select = vi.fn(() => ({ single }));
    const chain = { eq: vi.fn(), select };
    chain.eq.mockReturnValue(chain);
    const update = vi.fn(() => chain);
    mocks.from.mockReturnValue({ update });
    render(<ExperienceEditor city={city} userId="fixture-owner" visited item={selected} />);
    fireEvent.change(screen.getByLabelText('Titolo dell’esperienza'), { target: { value: 'Titolo aggiornato' } });
    fireEvent.change(screen.getByLabelText('Data della visita'), { target: { value: '2025-06-12' } });
    fireEvent.change(screen.getByLabelText('Note personali'), { target: { value: 'Nota aggiornata' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva esperienza' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.from).toHaveBeenCalledWith('visit_experiences');
    expect(update).toHaveBeenCalledWith({ title: 'Titolo aggiornato', visit_date: '2025-06-12', notes: 'Nota aggiornata' });
    expect(chain.eq.mock.calls).toEqual([['user_id', 'fixture-owner'], ['id', 'A'], ['deleting', false]]);
    expect(sibling).toEqual(experience('B'));
    expect(selected).toEqual(experience('A'));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not navigate or refresh as successful when creation fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('fixture failure') });
    render(<ExperienceEditor city={city} userId="fixture-owner" visited />);
    fireEvent.click(screen.getByRole('button', { name: /^Crea esperienza$/ }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Crea esperienza$/ })).not.toBeDisabled());
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});