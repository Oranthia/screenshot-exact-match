import type { Experience, ExperienceDraft } from "../contracts";
import { MEDIA_BUCKET, readAllPages, supabase } from "./shared";
import { toExperience } from "./mappers";

export async function fetchExperiences(userId: string): Promise<Experience[]> {
  const rows = await readAllPages((a, b) => supabase.from("visit_experiences").select("*").eq("user_id", userId).order("created_at").order("id").range(a, b));
  return rows.map(toExperience);
}
/** Atomic server function: validates the city, requires confirmation when OFF and marks the visit ON. */
export async function createExperience(cityId: string, draft: ExperienceDraft, confirmVisit: boolean): Promise<Experience> {
  const { data, error } = await supabase.rpc("create_my_experience", {
    _city_id: cityId, _title: draft.title, _visit_date: draft.visit_date as unknown as string, _notes: draft.notes as unknown as string, _confirm_visit: confirmVisit,
  });
  if (error) throw error;
  return toExperience(data);
}
export async function updateExperience(userId: string, id: string, draft: ExperienceDraft): Promise<void> {
  const { error } = await supabase.from("visit_experiences").update(draft).eq("user_id", userId).eq("id", id).eq("deleting", false).select("id").single();
  if (error) throw error;
}
/** Marks deleting (blocks new uploads), removes files and rows in retryable batches, then the experience. City state is untouched. */
export async function removeExperience(userId: string, experienceId: string): Promise<void> {
  const mark = await supabase.from("visit_experiences").update({ deleting: true }).eq("id", experienceId).eq("user_id", userId).select("id").single();
  if (mark.error) throw mark.error;
  for (;;) {
    const { data, error } = await supabase.from("visit_media").select("*").eq("user_id", userId).eq("experience_id", experienceId).order("id").limit(100);
    if (error) throw error;
    if (!data?.length) break;
    const storage = await supabase.storage.from(MEDIA_BUCKET).remove(data.map(r => r.storage_path));
    if (storage.error) throw storage.error;
    const removed = await supabase.from("visit_media").delete().eq("user_id", userId).eq("experience_id", experienceId).in("id", data.map(r => r.id));
    if (removed.error) throw removed.error;
  }
  const removed = await supabase.from("visit_experiences").delete().eq("id", experienceId).eq("user_id", userId);
  if (removed.error) throw removed.error;
}
