import { describe, expect, it } from "vitest";
import { prepareCoatImport } from "./coat-import";

describe("coat association import", () => {
  it("preserves a six-digit ISTAT code and only updates missing coats", () => {
    const sql = prepareCoatImport([{ istat_code: "001272", coat_of_arms_url: "https://images.example.org/torino.png" }]);
    expect(sql).toContain("('001272', 'https://images.example.org/torino.png')");
    expect(sql).toContain("m.istat_code = i.istat_code AND NULLIF(btrim(m.coat_of_arms_url), '') IS NULL");
    expect(sql).not.toContain("user_visits");
  });
  it("rejects duplicate associations", () => {
    const row = { istat_code: "001272", coat_of_arms_url: "https://images.example.org/torino.png" };
    expect(() => prepareCoatImport([row, row])).toThrow("duplicato");
  });
  it("rejects numeric codes instead of losing leading zeros", () => {
    expect(() => prepareCoatImport([{ istat_code: 1272, coat_of_arms_url: "https://images.example.org/torino.png" }])).toThrow("6 cifre");
  });
  it("rejects unsafe image URLs", () => {
    expect(() => prepareCoatImport([{ istat_code: "001272", coat_of_arms_url: "javascript:alert(1)" }])).toThrow("HTTPS");
  });
  it("aborts all writes when a code is not present in the catalog", () => {
    const sql = prepareCoatImport([{ istat_code: "001272", coat_of_arms_url: "https://images.example.org/torino.png" }]);
    expect(sql.indexOf("RAISE EXCEPTION")).toBeLessThan(sql.indexOf("UPDATE public.municipalities"));
    expect(sql).toContain("WHERE m.istat_code IS NULL");
  });
});