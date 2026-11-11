import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), signed: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from, storage: { from: () => ({ createSignedUrls: mocks.signed }) } } }));
import { geoQuery, useSaveVisit, visitsQuery } from "./queries";
import { computeProgress } from "./progress";

const saved = { id: "v1", user_id: "user-1", istat_code: "001272", visited: false, visit_date: "2026-11-01", notes: "Ricordo da conservare", updated_at: "2026-11-01T00:00:00Z" };

function paged(rows: unknown[]) {
  const builder = {
    select: vi.fn(() => builder), order: vi.fn(() => builder), eq: vi.fn(() => builder),
    range: vi.fn((from: number, to: number) => Promise.resolve({ data: rows.slice(from, to + 1), error: null })),
    then: (resolve: (result: unknown) => void) => Promise.resolve({ data: rows.slice(0, 1000), error: null }).then(resolve),
  };
  return builder;
}

describe("complete visit loading", () => {
  beforeEach(() => vi.clearAllMocks());
  it("loads all 2001 visits rather than silently stopping at 1000", async () => {
    const rows = Array.from({ length: 2001 }, (_, i) => ({ ...saved, id: `v${i}`, istat_code: String(i).padStart(6, "0") }));
    const builder = paged(rows);
    mocks.from.mockReturnValue(builder);
    const options = visitsQuery("user-1");
    const qc = new QueryClient();
    const result = await qc.fetchQuery(options);
    expect(result).toHaveLength(2001);
    expect(builder.range.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });
  it("propagates catalog metadata failures instead of showing a false demo status", async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === "catalog_meta") return { select: () => ({ maybeSingle: async () => ({ data: null, error: new Error("metadata unavailable") }) }) };
      return paged([]);
    });
    await expect(new QueryClient().fetchQuery(geoQuery)).rejects.toThrow("metadata unavailable");
  });
});

describe("visit saves and rollback", () => {
  beforeEach(() => vi.clearAllMocks());
  function setup() {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    qc.setQueryData(["visits", "user-1"], [saved]);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    return { qc, ...renderHook(() => useSaveVisit("user-1"), { wrapper }) };
  }
  it("updates regional and national counts before save completes, then keeps one row", async () => {
    let finish: ((value: unknown) => void) | undefined;
    const response = new Promise((resolve) => { finish = resolve; });
    const upsert = vi.fn(() => ({ select: () => ({ single: () => response }) }));
    mocks.from.mockReturnValue({ upsert });
    const { qc, result } = setup();
    act(() => result.current.mutate({ istat_code: "001272", visited: true }));
    await waitFor(() => expect(qc.getQueryData<typeof saved[]>(["visits", "user-1"])?.[0]?.visited).toBe(true));
    const rows = qc.getQueryData<typeof saved[]>(["visits", "user-1"]) ?? [];
    const progress = computeProgress([{ code: "01" }], [{ istat_code: "001272", region_code: "01" }], new Set(rows.filter(v => v.visited).map(v => v.istat_code)));
    expect(progress.national).toEqual({ visited: 1, total: 1, percent: 100 });
    expect(progress.perRegion.get("01")?.percent).toBe(100);
    expect(upsert).toHaveBeenCalledWith({ user_id: "user-1", istat_code: "001272", visited: true }, { onConflict: "user_id,istat_code" });
    await act(async () => finish?.({ data: { ...saved, visited: true }, error: null }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qc.getQueryData(["visits", "user-1"])).toEqual([{ ...saved, visited: true }]);
  });
  it("restores visit, date and notes when a save fails", async () => {
    mocks.from.mockReturnValue({ upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error("offline") }) }) }) });
    const { qc, result } = setup();
    act(() => result.current.mutate({ istat_code: "001272", visited: true }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData(["visits", "user-1"])).toEqual([saved]);
  });
});