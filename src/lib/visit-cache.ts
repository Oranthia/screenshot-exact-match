import type { Visit, VisitPatch } from "@/data/contracts";
export type { VisitPatch };

export function optimisticVisit(rows: Visit[], userId: string, patch: VisitPatch): Visit[] {
  const current = rows.find((row) => row.istat_code === patch.istat_code);
  const row: Visit = {
    id: `pending-${patch.istat_code}`,
    user_id: userId,
    visited: false,
    visit_date: null,
    notes: null,
    updated_at: new Date().toISOString(),
    ...current,
    ...patch,
  };
  return [row, ...rows.filter((item) => item.istat_code !== patch.istat_code)];
}