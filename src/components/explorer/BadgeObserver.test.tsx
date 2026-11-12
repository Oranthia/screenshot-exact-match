import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BadgeState } from '@/lib/badges';

const mocks = vi.hoisted(() => ({ state: undefined as BadgeState | undefined, message: vi.fn(), custom: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: mocks.state }) }));
vi.mock('@/lib/badge-queries', () => ({ badgesQuery: (userId: string) => ({ queryKey: ['badges', userId] }) }));
vi.mock('sonner', () => ({ toast: { message: mocks.message, custom: mocks.custom } }));
import { BadgeObserver } from './BadgeObserver';

const state = (ids: string[]): BadgeState => ({ earned: ids.map(badge_id => ({ badge_id, earned_at: '2026-11-05' })), featured: [], metrics: { cities: 0, regions: 0, memories: 0 } });
describe('badge notification transitions with isolated fixtures', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.state = state([]); });
  afterEach(cleanup);
  it('does not announce an unlock for an empty collection', () => {
    render(<BadgeObserver userId="fixture-owner" />);
    expect(mocks.custom).not.toHaveBeenCalled();
    expect(mocks.message).not.toHaveBeenCalled();
  });
  it('announces one newly earned badge once, not on identical refetches', async () => {
    const view = render(<BadgeObserver userId="fixture-owner" />);
    mocks.state = state(['prima-impronta']);
    view.rerender(<BadgeObserver userId="fixture-owner" />);
    await waitFor(() => expect(mocks.custom).toHaveBeenCalledTimes(1));
    mocks.state = state(['prima-impronta']);
    view.rerender(<BadgeObserver userId="fixture-owner" />);
    expect(mocks.custom).toHaveBeenCalledTimes(1);
  });
  it('announces simultaneous new badges as one notification without individual duplicates', async () => {
    const view = render(<BadgeObserver userId="fixture-owner" />);
    mocks.state = state(['prima-impronta', 'esploratore-curioso', 'viandante']);
    view.rerender(<BadgeObserver userId="fixture-owner" />);
    await waitFor(() => expect(mocks.message).toHaveBeenCalledTimes(1));
    expect(mocks.custom).not.toHaveBeenCalled();
    mocks.state = state(['prima-impronta', 'esploratore-curioso', 'viandante']);
    view.rerender(<BadgeObserver userId="fixture-owner" />);
    expect(mocks.message).toHaveBeenCalledTimes(1);
  });
});