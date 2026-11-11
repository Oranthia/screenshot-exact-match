import { describe, expect, it } from "vitest";
import { optimisticVisit } from "./visit-cache";

describe("immediate crest visit state", () => {
  const saved = { id: "visit-1", user_id: "user-1", istat_code: "001272", visited: true, visit_date: "2026-11-01", notes: "Ricordo", updated_at: "2026-11-01T00:00:00Z" };
  it("immediately unlocks a newly visited municipality in the shared cache", () => {
    const rows = optimisticVisit([], "user-1", { istat_code: "001272", visited: true });
    expect(rows[0]?.visited).toBe(true);
    expect(rows[0]?.istat_code).toBe("001272");
  });
  it("relocks an existing visit without deleting date or notes", () => {
    const rows = optimisticVisit([saved], "user-1", { istat_code: "001272", visited: false });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "visit-1", visited: false, visit_date: "2026-11-01", notes: "Ricordo" });
    expect(saved.visited).toBe(true);
  });
});