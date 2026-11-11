import { describe, expect, it } from "vitest";
import initial from "../../scripts/data/initial-cities.json";
import { computeProgress } from "./progress";
import { optimisticVisit } from "./visit-cache";

describe("initial expanding city catalog", () => {
  it("contains about 100 unique real selected cities across all 20 regions", () => {
    expect(initial.cities).toHaveLength(104);
    expect(new Set(initial.cities.map(c => `${c.name}|${c.region_code}`)).size).toBe(104);
    expect(new Set(initial.cities.map(c => c.region_code)).size).toBe(20);
    expect(initial.cities.find(c => c.name === "Matera")?.region_code).toBe("17");
    expect(initial.cities.find(c => c.name === "Aosta")?.region_code).toBe("02");
  });
  const regions = Array.from({ length: 20 }, (_, i) => ({ code: String(i + 1).padStart(2, "0") }));
  const cities = initial.cities.map(c => ({ istat_code: c.name, region_code: c.region_code }));
  it("starts a new user's catalog at zero visits and zero explored regions", () => {
    const p = computeProgress(regions, cities, new Set());
    expect(p.national).toEqual({ visited: 0, total: 104, percent: 0 });
    expect(p.regionsExplored).toBe(0);
    expect(p.regionsCompleted).toBe(0);
    expect(p.regionsTotal).toBe(20);
  });
  it("repeated visit activation creates only one counted entry", () => {
    const first = optimisticVisit([], "user", { istat_code: "Aosta", visited: true });
    const second = optimisticVisit(first, "user", { istat_code: "Aosta", visited: true });
    expect(second).toHaveLength(1);
    const p = computeProgress(regions, cities, new Set(second.filter(v => v.visited).map(v => v.istat_code)));
    expect(p.national.visited).toBe(1);
    expect(p.national.percent).toBe(1);
    expect(p.perRegion.get("02")?.percent).toBe(100);
  });
  it("deactivating a visit reduces counts but keeps date and notes", () => {
    const visited = optimisticVisit([], "user", { istat_code: "Aosta", visited: true, visit_date: "2026-11-01", notes: "Ricordo" });
    const off = optimisticVisit(visited, "user", { istat_code: "Aosta", visited: false });
    const p = computeProgress(regions, cities, new Set(off.filter(v => v.visited).map(v => v.istat_code)));
    expect(p.national.visited).toBe(0);
    expect(p.perRegion.get("02")?.percent).toBe(0);
    expect(off[0]).toMatchObject({ visit_date: "2026-11-01", notes: "Ricordo" });
  });
  it("recomputes percentages when the available catalog grows", () => {
    const p = computeProgress(regions, [...cities, { istat_code: "future-city", region_code: "02" }], new Set(["Aosta"]));
    expect(p.national.total).toBe(105);
    expect(p.perRegion.get("02")?.percent).toBe(50);
    expect(p.perRegion.get("02")?.completed).toBe(false);
  });
});