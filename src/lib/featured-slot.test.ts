import { describe, expect, it } from "vitest";
import { validateFeaturedSlot } from "./featured-slot";
const state = { earned: [{ badge_id: "prima-impronta", earned_at: "2026-11-11" }], featured: [], metrics: { cities: 1, regions: 1, memories: 0 } };
describe("exact showcase slots", () => {
  it("accepts only positions 1 through 3", () => {
    for (const position of [1,2,3]) expect(() => validateFeaturedSlot(position, "prima-impronta", state)).not.toThrow();
    for (const position of [0,4,1.5]) expect(() => validateFeaturedSlot(position, "prima-impronta", state)).toThrow();
  });
  it("accepts only earned badges or a removal", () => {
    expect(() => validateFeaturedSlot(3, null, state)).not.toThrow();
    expect(() => validateFeaturedSlot(3, "italia-in-tasca", state)).toThrow();
  });
});