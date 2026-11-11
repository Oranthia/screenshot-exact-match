import { describe, expect, it } from "vitest";
import { diaryEntries } from "./diary";
import { diaryModeKey, timelineEntries, timelineGroups, type DiaryEntry } from "./diary-timeline";

const entry = (id: string, date: string | null, region = "01"): DiaryEntry => ({
  city: { name: id, istat_code: id, region_code: region, province_code: "p", slug: id, id, official_istat_code: null, coat_of_arms_url: null },
  visit: { id, istat_code: id, user_id: "owner", visited: true, visit_date: date, updated_at: "2030-12-31", notes: "Preservata" },
});
describe("diary timeline", () => {
  it("orders actual visit dates by year/month/day with undated entries separate, ignoring updated_at", () => {
    const rows = [entry("Senza data", null), entry("Ottobre", "2026-10-18"), entry("Novembre", "2026-11-05"), entry("Prima", "2025-12-03")];
    const sorted = timelineEntries(rows);
    expect(sorted.map(e => e.city.name)).toEqual(["Novembre", "Ottobre", "Prima", "Senza data"]);
    expect(timelineGroups(sorted).map(g => [g.year, g.month])).toEqual([["2026", "novembre"], ["2026", "ottobre"], ["2025", "dicembre"], ["", "Data non indicata"]]);
    expect(rows[0]?.visit.visit_date).toBeNull();
  });
  it("filters on the recorded year only, never the saved timestamp", () => {
    expect(timelineEntries([entry("a", "2026-11-05"), entry("b", null), entry("c", "2025-11-05")], "2026").map(e => e.city.name)).toEqual(["a"]);
    expect(timelineEntries([entry("b", null)], "2030")).toEqual([]);
  });
  it("supports chronological ascending order with undated entries still last", () => {
    expect(timelineEntries([entry("a", "2026-11-05"), entry("b", null), entry("c", "2025-11-05")], "", true).map(e => e.city.name)).toEqual(["c", "a", "b"]);
  });
  it("shares city search and region filters without modifying records", () => {
    const rows = [entry("Venezia", "2026-11-05", "05"), entry("Verona", "2026-10-05", "05"), entry("Roma", null, "12")];
    const filtered = diaryEntries(rows.map(e => e.city), rows.map(e => e.visit), { q: "ven", region: "05", sort: "date" });
    expect(filtered.map(e => e.city.name)).toEqual(["Venezia"]);
    expect(timelineEntries(filtered).map(e => e.city.name)).toEqual(["Venezia"]);
    expect(rows.map(e => e.visit.notes)).toEqual(["Preservata", "Preservata", "Preservata"]);
  });
  it("keeps viewing preferences scoped to each identity", () => {
    expect(diaryModeKey("a")).toBe("italia-explorer:diary-mode:a");
    expect(diaryModeKey("b")).not.toBe(diaryModeKey("a"));
  });
});