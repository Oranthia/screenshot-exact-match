import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
import { badgesQuery, useFeaturedBadges } from "./badge-queries";
const state = { earned: [{ badge_id: "prima-impronta", earned_at: "2026-11-11T11:30:00Z" }], featured: [], metrics: { cities: 1, regions: 1, memories: 0 } };
describe("private badge queries", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uses the authenticated evaluator without accepting another user ID", async () => {
    mocks.rpc.mockResolvedValue({ data: state, error: null });
    const qc = new QueryClient();
    expect(await qc.fetchQuery(badgesQuery("owner"))).toEqual(state);
    expect(mocks.rpc).toHaveBeenCalledWith("sync_my_badges");
    expect(qc.getQueryData(badgesQuery("other").queryKey)).toBeUndefined();
  });
  it("propagates evaluator failures", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    await expect(new QueryClient().fetchQuery(badgesQuery("owner"))).rejects.toThrow("offline");
  });
  it("saves owner-scoped selection and updates shared cache only after success", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const qc = new QueryClient(); qc.setQueryData(badgesQuery("owner").queryKey, state);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useFeaturedBadges("owner"), { wrapper });
    await act(async () => { await result.current.mutateAsync(["prima-impronta"]); });
    expect(mocks.rpc).toHaveBeenCalledWith("set_my_featured_badges", { _ids: ["prima-impronta"] });
    expect(qc.getQueryData(badgesQuery("owner").queryKey)?.featured).toEqual([{ badge_id: "prima-impronta", position: 1 }]);
    expect(qc.getQueryData(badgesQuery("other").queryKey)).toBeUndefined();
  });
  it("keeps previous selection when save fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    const qc = new QueryClient(); qc.setQueryData(badgesQuery("owner").queryKey, state);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useFeaturedBadges("owner"), { wrapper });
    await act(async () => { await expect(result.current.mutateAsync(["prima-impronta"])).rejects.toThrow("offline"); });
    expect(qc.getQueryData(badgesQuery("owner").queryKey)).toEqual(state);
  });
});