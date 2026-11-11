import { expect, it } from "vitest";
import { orderRegions } from "./region-order";
import { computeProgress } from "./progress";

it("puts explored regions first by decreasing percentage, then unexplored regions alphabetically", () => {
  const regions = [{ code: "a", name: "Veneto" }, { code: "b", name: "Lazio" }, { code: "c", name: "Umbria" }, { code: "d", name: "Abruzzo" }];
  const cities = [{ istat_code: "1", region_code: "a" }, { istat_code: "2", region_code: "a" }, { istat_code: "3", region_code: "b" }];
  const stats = computeProgress(regions, cities, new Set(["1", "3"]));
  expect(orderRegions(regions, stats.perRegion).map(r => r.name)).toEqual(["Lazio", "Veneto", "Abruzzo", "Umbria"]);
  expect(regions.map(r => r.name)).toEqual(["Veneto", "Lazio", "Umbria", "Abruzzo"]);
});