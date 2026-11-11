// Calcoli di avanzamento: sempre derivati dai dati reali, mai valori fissi.
export type RegionLite = { code: string };
export type MunicipalityLite = { istat_code: string; region_code: string };

export type Progress = { visited: number; total: number; percent: number };
export type RegionProgress = Progress & { explored: boolean; completed: boolean };

export function percent(visited: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((visited / total) * 1000) / 10;
}

export function computeProgress(
  regions: RegionLite[],
  municipalities: MunicipalityLite[],
  visitedCodes: Set<string>,
) {
  const perRegion = new Map<string, RegionProgress>();
  for (const r of regions) {
    perRegion.set(r.code, { visited: 0, total: 0, percent: 0, explored: false, completed: false });
  }
  let visited = 0;
  for (const m of municipalities) {
    const rp = perRegion.get(m.region_code);
    if (!rp) continue;
    rp.total += 1;
    if (visitedCodes.has(m.istat_code)) {
      rp.visited += 1;
      visited += 1;
    }
  }
  let regionsExplored = 0;
  let regionsCompleted = 0;
  for (const rp of perRegion.values()) {
    rp.percent = percent(rp.visited, rp.total);
    rp.explored = rp.visited > 0;
    rp.completed = rp.total > 0 && rp.visited === rp.total;
    if (rp.explored) regionsExplored += 1;
    if (rp.completed) regionsCompleted += 1;
  }
  const total = municipalities.length;
  return {
    national: { visited, total, percent: percent(visited, total) } as Progress,
    regionsExplored,
    regionsCompleted,
    regionsTotal: regions.length,
    perRegion,
  };
}
