import { describe, expect, it } from "vitest";
import { diaryEntries, firstDiaryPhotos } from "./diary";
import { optimisticVisit } from "./visit-cache";
import type { Municipality, Visit, VisitMedia } from "./queries";

const city = (name: string, code: string, region = "01") => ({ name, istat_code: code, region_code: region }) as Municipality;
const visit = (code: string, visited: boolean, date: string | null = null) => ({ id: code, user_id: "u", istat_code: code, visited, visit_date: date, notes: "Ricordo" }) as Visit;
const filters = { q: "", region: "", sort: "date" as const };
describe("personal diary", () => {
  it("shows only visited cities and starts empty for a new user", () => {
    const cities = [city("Roma", "a"), city("Milano", "b")];
    expect(diaryEntries(cities, [], filters)).toEqual([]);
    expect(diaryEntries(cities, [visit("a", true), visit("b", false)], filters).map(e => e.city.name)).toEqual(["Roma"]);
  });
  it("reflects ON and OFF directly from the shared optimistic visits without erasing memories", () => {
    const cities = [city("Roma", "a")];
    const on = optimisticVisit([visit("a", false, "2026-11-01")], "u", { istat_code: "a", visited: true });
    expect(diaryEntries(cities, on, filters)).toHaveLength(1);
    const off = optimisticVisit(on, "u", { istat_code: "a", visited: false });
    expect(diaryEntries(cities, off, filters)).toHaveLength(0);
    expect(off[0]?.notes).toBe("Ricordo");
    expect(off[0]?.visit_date).toBe("2026-11-01");
  });
  it("searches and filters thousands of cities by name and region", () => {
    const cities = Array.from({ length: 3000 }, (_, i) => city(`Città ${i}`, String(i), i === 2999 ? "02" : "01"));
    const visits = cities.map(c => visit(c.istat_code, true));
    expect(diaryEntries(cities, visits, { q: "citta 2999", region: "02", sort: "name" }).map(e => e.city.istat_code)).toEqual(["2999"]);
    expect(diaryEntries(cities, visits, { q: "citta 2999", region: "01", sort: "name" })).toEqual([]);
  });
  it("sorts by newest visit date with undated cities last or alphabetically", () => {
    const cities = [city("Roma", "a"), city("Bari", "b"), city("Aosta", "c")];
    const visits = [visit("a", true, "2026-11-02"), visit("b", true, "2026-11-01"), visit("c", true)];
    expect(diaryEntries(cities, visits, filters).map(e => e.city.name)).toEqual(["Roma", "Bari", "Aosta"]);
    expect(diaryEntries(cities, visits, { ...filters, sort: "name" }).map(e => e.city.name)).toEqual(["Aosta", "Bari", "Roma"]);
  });
  it("selects the first personal photo, never a video", () => {
    const rows = [{ id: "2", istat_code: "a", media_type: "photo", created_at: "2026-11-02" }, { id: "1", istat_code: "a", media_type: "photo", created_at: "2026-11-01" }, { id: "0", istat_code: "a", media_type: "video", created_at: "2026-10-01" }] as VisitMedia[];
    expect(firstDiaryPhotos(rows).map(p => p.id)).toEqual(["1"]);
  });
  it("prefers the single owner-selected photo cover and falls back after deletion", () => {
    const rows = [
      { id: "1", istat_code: "a", media_type: "photo", created_at: "2026-11-01", is_cover: false },
      { id: "2", istat_code: "a", media_type: "photo", created_at: "2026-11-02", is_cover: true },
    ] as VisitMedia[];
    expect(firstDiaryPhotos(rows).map(p => p.id)).toEqual(["2"]);
    expect(firstDiaryPhotos(rows.filter(p => p.id !== "2")).map(p => p.id)).toEqual(["1"]);
    expect(firstDiaryPhotos([])).toEqual([]);
  });
  it("sorts oldest visits first", () => {
    const cities = [city("Roma", "a"), city("Bari", "b")];
    expect(diaryEntries(cities, [visit("a", true, "2026-11-02"), visit("b", true, "2026-11-01")], { ...filters, sort: "date-asc" }).map(e => e.city.name)).toEqual(["Bari", "Roma"]);
  });
  it("sorts names Z-A", () => {
    expect(diaryEntries([city("Bari", "b"), city("Roma", "a")], [visit("b", true), visit("a", true)], { ...filters, sort: "name-desc" }).map(e => e.city.name)).toEqual(["Roma", "Bari"]);
  });
  it("uses the existing saved timestamp when visit dates are missing without inventing visit dates", () => {
    const cities = [city("Roma", "a"), city("Bari", "b")];
    const visits = [{ ...visit("a", true), updated_at: "2026-11-03T12:00:00Z" }, visit("b", true, "2026-11-02")];
    expect(diaryEntries(cities, visits, filters).map(e => e.city.name)).toEqual(["Roma", "Bari"]);
    expect(diaryEntries(cities, visits, { ...filters, sort: "date-asc" }).map(e => e.city.name)).toEqual(["Bari", "Roma"]);
    expect(visits[0]?.visit_date).toBeNull();
  });
});