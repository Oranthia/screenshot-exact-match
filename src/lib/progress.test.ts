import { describe, expect, it } from "vitest";
import { computeProgress } from "./progress";
import { validateMedia } from "./media";

const regions = [{ code: "01" }, { code: "03" }, { code: "05" }];
const munis = [
  { istat_code: "001272", region_code: "01" },
  { istat_code: "015146", region_code: "03" },
  { istat_code: "015999", region_code: "03" },
];

describe("progress", () => {
  it("a region with one visited comune is explored but not completed", () => {
    const p = computeProgress(regions, munis, new Set(["015146"]));
    const r = p.perRegion.get("03")!;
    expect(r.explored).toBe(true);
    expect(r.completed).toBe(false);
    expect(r.percent).toBe(50);
  });
  it("a region is completed only when all its comuni are visited", () => {
    const p = computeProgress(regions, munis, new Set(["015146", "015999"]));
    expect(p.perRegion.get("03")!.completed).toBe(true);
    expect(p.regionsCompleted).toBe(1);
  });
  it("a region with no comuni in the catalog is never completed", () => {
    const p = computeProgress(regions, munis, new Set());
    expect(p.perRegion.get("05")!.completed).toBe(false);
  });
  it("national percent comes from real counts", () => {
    const p = computeProgress(regions, munis, new Set(["001272"]));
    expect(p.national).toEqual({ visited: 1, total: 3, percent: 33.3 });
    expect(p.regionsExplored).toBe(1);
  });
});

describe("media validation", () => {
  it("rejects photos over 10 MB", () => {
    expect(validateMedia({ type: "image/jpeg", size: 11 * 1024 * 1024, name: "a.jpg" }).ok).toBe(false);
  });
  it("accepts MOV videos up to 50 MB", () => {
    expect(validateMedia({ type: "", size: 40 * 1024 * 1024, name: "a.MOV" })).toEqual({ ok: true, kind: "video" });
  });
  it("rejects GIF", () => {
    expect(validateMedia({ type: "image/gif", size: 10, name: "a.gif" }).ok).toBe(false);
  });
});
