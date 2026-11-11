import { describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), signed: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from, storage: { from: () => ({ createSignedUrls: mocks.signed }) } } }));
import { QueryClient } from "@tanstack/react-query";
import { diaryPhotosQuery } from "./diary-photos";
describe("private diary covers", () => {
  it("scopes photos to the owner and requested cities and preserves working covers when one URL fails", async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [
      { id: "1", istat_code: "a", storage_path: "owner/a/1", media_type: "photo", created_at: "2026-01-01" },
      { id: "2", istat_code: "b", storage_path: "owner/b/2", media_type: "photo", created_at: "2026-01-01" },
    ], error: null }) };
    mocks.from.mockReturnValue(chain);
    mocks.signed.mockResolvedValue({ data: [{ signedUrl: "working" }, { error: "missing" }], error: null });
    const result = await new QueryClient().fetchQuery(diaryPhotosQuery("owner", ["a", "b"]));
    expect(chain.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(chain.eq).toHaveBeenCalledWith("media_type", "photo");
    expect(chain.in).toHaveBeenCalledWith("istat_code", ["a", "b"]);
    expect(result.map(p => p.url)).toEqual(["working", ""]);
    expect(diaryPhotosQuery("owner", []).refetchInterval).toBe(45 * 60 * 1000);
  });
});