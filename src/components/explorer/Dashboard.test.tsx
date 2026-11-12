import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { City, Experience, Visit } from '@/data/contracts';

const mocks = vi.hoisted(() => ({ catalog: vi.fn(), visits: vi.fn(), experiences: vi.fn(), photos: vi.fn() }));
vi.mock('@/data/backend', () => ({ fetchCatalog: mocks.catalog, fetchVisits: mocks.visits, fetchExperiences: mocks.experiences, fetchDiaryPhotos: mocks.photos }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a> }));
vi.mock('./BadgeShowcase', () => ({ BadgeShowcase: () => null }));
vi.mock('./DiaryCover', () => ({ DiaryCover: () => null }));
import { Dashboard } from './Dashboard';

const city: City = { id: 'fixture-city', istat_code: 'city:fixture', official_istat_code: null, name: 'Città fixture', slug: 'fixture', province_code: 'p', region_code: 'r', coat_of_arms_url: null };
const visit: Visit = { id: 'fixture-visit', user_id: 'fixture-owner', istat_code: city.istat_code, visited: true, visit_date: null, notes: null, updated_at: '2026-11-01' };
const experience: Experience = { id: 'fixture-exp', city_id: city.id, istat_code: city.istat_code, user_id: visit.user_id, title: 'Fixture', visit_date: null, notes: null, created_at: '2026-11-01', updated_at: '2026-11-01', legacy_source_key: null, deleting: false };
let client: QueryClient;
function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}><Dashboard userId="fixture-owner" /></QueryClientProvider>);
}
describe('Home states without personal data or backend requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.catalog.mockResolvedValue({ cities: [city], regions: [{ code: 'r', name: 'Regione fixture', slug: 'fixture' }], provinces: [], catalogComplete: false, nationalTotal: 1 });
    mocks.visits.mockResolvedValue([]); mocks.experiences.mockResolvedValue([]); mocks.photos.mockResolvedValue([]);
  });
  afterEach(() => { cleanup(); client?.clear(); });
  it('keeps loading distinct from a valid empty passport', () => {
    mocks.catalog.mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole('status', { name: 'Caricamento del passaporto' })).toBeInTheDocument();
    expect(screen.queryByText(/passaporto è ancora vuoto/)).not.toBeInTheDocument();
  });
  it('shows a true zero and invitation when all reads succeed with no visits', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: 'Italia esplorata al 0%' })).toBeInTheDocument();
    expect(await screen.findByText(/passaporto è ancora vuoto/)).toBeInTheDocument();
  });
  it('does not turn a statistics read failure into zero or expose service details', async () => {
    mocks.visits.mockRejectedValue(new Error('private database details'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile caricare statistiche');
    expect(screen.queryByText(/private database/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Italia esplorata/ })).not.toBeInTheDocument();
  });
  it('retries existing queries and recovers from catalog failure', async () => {
    mocks.catalog.mockRejectedValueOnce(new Error('fixture error'));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('heading', { name: 'Italia esplorata al 0%' })).toBeInTheDocument();
    expect(mocks.catalog).toHaveBeenCalledTimes(2);
  });
  it('updates statistics through the shared visits cache without refetch duplication', async () => {
    mount(); await screen.findByRole('heading', { name: 'Italia esplorata al 0%' });
    client.setQueryData(['visits', 'fixture-owner'], [visit]);
    expect(await screen.findByRole('heading', { name: 'Italia esplorata al 100%' })).toBeInTheDocument();
    expect(mocks.visits).toHaveBeenCalledTimes(1);
  });
  it('retains previous successful statistics after a failed refresh', async () => {
    mocks.visits.mockResolvedValue([visit]); mount();
    await screen.findByRole('heading', { name: 'Italia esplorata al 100%' });
    mocks.visits.mockRejectedValue(new Error('fixture refresh failure'));
    await client.refetchQueries({ queryKey: ['visits', 'fixture-owner'] });
    expect(await screen.findByRole('alert')).toHaveTextContent('ultimi dati disponibili');
    expect(screen.getByRole('heading', { name: 'Italia esplorata al 100%' })).toBeInTheDocument();
    expect(client.getQueryData(['visits', 'fixture-owner'])).toEqual([visit]);
  });
  it('does not call pending experience data an empty passport', async () => {
    mocks.experiences.mockReturnValue(new Promise(() => {})); mount();
    expect(await screen.findByRole('status', { name: 'Caricamento ultime città' })).toBeInTheDocument();
    expect(screen.queryByText(/passaporto è ancora vuoto/)).not.toBeInTheDocument();
  });
  it('reports experience failure and retries it without hiding valid statistics', async () => {
    mocks.visits.mockResolvedValue([visit]); mocks.experiences.mockRejectedValueOnce(new Error('fixture error')); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile caricare le esperienze');
    expect(screen.queryByText(/passaporto è ancora vuoto/)).not.toBeInTheDocument();
    mocks.experiences.mockResolvedValue([experience]);
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('heading', { name: city.name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Italia esplorata al 100%' })).toBeInTheDocument();
  });
  it('reports photo failures but keeps undated cities and does not invent a date', async () => {
    mocks.visits.mockResolvedValue([visit]); mocks.experiences.mockResolvedValue([experience]);
    mocks.photos.mockImplementation((_: string, codes: string[]) => codes.length ? Promise.reject(new Error('fixture')) : Promise.resolve([])); mount();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Impossibile caricare le fotografie'));
    expect(screen.getByRole('heading', { name: city.name })).toBeInTheDocument();
    expect(screen.queryByText('1 novembre 2026')).not.toBeInTheDocument();
  });
});