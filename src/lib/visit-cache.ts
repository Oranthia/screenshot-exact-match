import type { Tables } from "@/integrations/supabase/types";

type Visit = Tables<"user_visits">;
export type VisitPatch = { istat_code: string; visited?: boolean; visit_date?: string | null; notes?: string | null };

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