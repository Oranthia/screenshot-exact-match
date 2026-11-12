import type { Visit, VisitPatch } from "../contracts";
import { readAllPages, supabase } from "./shared";
import { toVisit } from "./mappers";

export async function fetchVisits(userId: string): Promise<Visit[]> {
  const rows = await readAllPages((a, b) => supabase.from("user_visits").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false }).order("id").range(a, b));
  return rows.map(toVisit);
}
/** One row per user/city (unique constraint): repeated saves update instead of duplicating. */
export async function saveVisit(userId: string, patch: VisitPatch): Promise<Visit> {
  const { data, error } = await supabase.from("user_visits").upsert({ user_id: userId, ...patch }, { onConflict: "user_id,istat_code" }).select().single();
  if (error) throw error;
  return toVisit(data);
}
