import type { RegionProgress } from "./progress";

export function orderRegions<T extends { code: string; name: string }>(regions: T[], progress: Map<string, RegionProgress>): T[] {
  return [...regions].sort((a, b) => {
    const ap = progress.get(a.code);
    const bp = progress.get(b.code);
    const exploredOrder = Number(!!bp?.explored) - Number(!!ap?.explored);
    if (exploredOrder) return exploredOrder;
    if (ap?.explored && bp?.explored && ap.percent !== bp.percent) return bp.percent - ap.percent;
    return a.name.localeCompare(b.name, "it");
  });
}