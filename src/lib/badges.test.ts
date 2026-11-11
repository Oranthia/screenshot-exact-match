import { describe, expect, it } from "vitest";
import { BADGES, eligibleBadges, validateFeatured } from "./badges";

describe("deterministic badge thresholds", () => {
  it("starts with no earned badges at zero cities, regions and memories", () => {
    expect(eligibleBadges({ cities: 0, regions: 0, memories: 0 })).toEqual([]);
  });
  const rules = [
    ["prima-impronta", "cities", 1], ["esploratore-curioso", "cities", 5], ["viandante", "cities", 10],
    ["passaporto-vissuto", "cities", 25], ["girovago", "cities", 50], ["cento-orizzonti", "cities", 100],
    ["tre-terre", "regions", 3], ["cinque-regioni", "regions", 5], ["attraverso-italia", "regions", 10], ["italia-in-tasca", "regions", 20],
    ["primo-ricordo", "memories", 1], ["album-di-viaggio", "memories", 5],
  ] as const;
  for (const [id, metric, threshold] of rules) it(`${id} unlocks at exactly ${threshold} ${metric}`, () => {
    expect(eligibleBadges({ cities: 0, regions: 0, memories: 0, [metric]: threshold - 1 })).not.toContain(id);
    expect(eligibleBadges({ cities: 0, regions: 0, memories: 0, [metric]: threshold })).toContain(id);
  });
  it("awards the first three city milestones retroactively without duplicates", () => {
    expect(eligibleBadges({ cities: 10, regions: 1, memories: 0 })).toEqual(["prima-impronta", "esploratore-curioso", "viandante"]);
    expect(new Set(BADGES.map(b => b.id)).size).toBe(12);
  });
});
describe("featured achievements", () => {
  const earned = ["prima-impronta", "esploratore-curioso", "viandante", "tre-terre"];
  it("allows three unlocked badges in the supplied order", () => {
    expect(validateFeatured([earned[2], earned[0], earned[1]], earned)).toEqual(["viandante", "prima-impronta", "esploratore-curioso"]);
  });
  it("rejects more than three slots", () => { expect(() => validateFeatured(earned, earned)).toThrow("3"); });
  it("rejects duplicate badges", () => { expect(() => validateFeatured([earned[0], earned[0]], earned)).toThrow("una sola volta"); });
  it("rejects unearned badges", () => { expect(() => validateFeatured(["cento-orizzonti"], earned)).toThrow("ottenute"); });
  it("allows removal and replacement", () => {
    expect(validateFeatured([], earned)).toEqual([]);
    expect(validateFeatured([earned[3], earned[1], earned[2]], earned)).toEqual(["tre-terre", "esploratore-curioso", "viandante"]);
  });
});