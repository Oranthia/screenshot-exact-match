import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const upsertSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    from: () => ({ upsert: () => ({ select: () => ({ single: () => upsertSingle() }) }) }),
  },
}));

import { toCity, toExperience, toVisit } from "./mappers";
import { buildPreviews } from "./media";
import { toProfile } from "./profile";
import { saveVisit, setFeaturedSlot, syncBadges } from "./index";

const exp = { id: "e1", user_id: "u", city_id: "c", istat_code: "058091", title: "T", visit_date: null, notes: null, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-03T00:00:00Z", legacy_source_key: null, deleting: false };
const media = (id: string, experience_id: string | null, media_type: string) => ({ id, user_id: "u", istat_code: "x", experience_id, file_name: "f", media_type, storage_path: `p/${id}`, caption: null, created_at: "2026-01-01T00:00:00Z", is_cover: false });

describe("mappers", () => {
  it("keeps a missing visit date null instead of inventing today", () => {
    expect(toExperience(exp).visit_date).toBeNull();
    expect(toVisit({ id: "v", user_id: "u", istat_code: "x", visited: true, visit_date: null, notes: null, updated_at: "2026-01-01T00:00:00Z" }).visit_date).toBeNull();
  });
  it("keeps creation and modification timestamps distinct from the visit date", () => {
    const e = toExperience({ ...exp, visit_date: "2025-05-01" });
    expect([e.visit_date, e.created_at, e.updated_at]).toEqual(["2025-05-01", exp.created_at, exp.updated_at]);
  });
  it("copies only contract fields and normalizes optional city values to null", () => {
    const c = toCity({ id: "c", istat_code: "city:roma", official_istat_code: null, name: "Roma", slug: "roma", province_code: "RM", region_code: "12", coat_of_arms_url: null, extra: 1 } as never);
    expect(c).toEqual({ id: "c", istat_code: "city:roma", official_istat_code: null, name: "Roma", slug: "roma", province_code: "RM", region_code: "12", coat_of_arms_url: null });
  });
});

describe("media previews", () => {
  it("counts photos and videos per experience and links only the first photo", () => {
    const rows = [media("m1", "e1", "photo"), media("m2", "e1", "video"), media("m3", "e1", "photo"), media("m4", "e2", "video")];
    const [a, b] = buildPreviews(["e1", "e2"], rows, ["signed-1"]);
    expect(a).toMatchObject({ id: "e1", photos: 2, videos: 1, photo: { id: "m1", url: "signed-1" } });
    expect(b).toMatchObject({ id: "e2", photos: 0, videos: 1, photo: undefined });
  });
  it("returns an empty link when signing failed rather than throwing", () => {
    expect(buildPreviews(["e1"], [media("m1", "e1", "photo")], [])[0]?.photo?.url).toBe("");
  });
});

describe("profile", () => {
  it("prefers display_name and treats blank names as missing", () => {
    expect(toProfile({ user: { id: "u", email: "a@b.it", user_metadata: { display_name: "Lucia", full_name: "X" } } } as never)?.displayName).toBe("Lucia");
    expect(toProfile({ user: { id: "u", email: null, user_metadata: { display_name: "  " } } } as never)?.displayName).toBeNull();
    expect(toProfile(null)).toBeNull();
  });
});

describe("writes and errors", () => {
  beforeEach(() => { rpc.mockReset(); upsertSingle.mockReset(); });
  it("propagates backend errors from saving a visit", async () => {
    upsertSingle.mockResolvedValue({ data: null, error: new Error("rls") });
    await expect(saveVisit("u", { istat_code: "x", visited: true })).rejects.toThrow("rls");
  });
  it("sends an emptied showcase slot as null to the atomic slot function", async () => {
    rpc.mockResolvedValue({ error: null });
    await setFeaturedSlot(2, null);
    expect(rpc).toHaveBeenCalledWith("set_my_featured_badge_slot", { _position: 2, _badge_id: null });
  });
  it("fills an empty badge response with zero metrics and no awards", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await syncBadges()).toEqual({ earned: [], featured: [], metrics: { cities: 0, regions: 0, memories: 0 } });
  });
  it("rejects when badge sync fails", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("down") });
    await expect(syncBadges()).rejects.toThrow("down");
  });
});

describe("separation", () => {
  it("only the adapter, managed auth gate and generated integration import the database client", () => {
    const allowed = [/^src\/integrations\//, /^src\/data\/backend\//, /^src\/routes\/_authenticated\/route\.tsx$/, /^src\/start\.ts$/, /\.test\.tsx?$/];
    const walk = (d: string): string[] => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    const offenders = walk("src").filter(p => /\.tsx?$/.test(p) && !allowed.some(r => r.test(p)) && /integrations\/supabase\/client["']/.test(readFileSync(p, "utf8")));
    expect(offenders).toEqual([]);
  });
});
