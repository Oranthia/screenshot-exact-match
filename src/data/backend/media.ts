import type { ExperiencePreview, Media, MediaKind, SignedMedia } from "../contracts";
import { firstDiaryPhotos } from "@/lib/diary";
import { MEDIA_BUCKET, readAllPages, signPaths, supabase } from "./shared";
import { toMedia } from "./mappers";

export async function fetchMedia(userId: string, istat: string, experienceId?: string): Promise<SignedMedia[]> {
  const rows = (await readAllPages((a, b) => {
    let q = supabase.from("visit_media").select("*").eq("user_id", userId).eq("istat_code", istat)
      .order("created_at", { ascending: false }).order("id").range(a, b);
    if (experienceId) q = q.eq("experience_id", experienceId);
    return q;
  })).map(toMedia);
  const urls = await signPaths(rows.map(m => m.storage_path), true);
  return rows.map((m, i) => ({ ...m, url: urls[i] ?? "" }));
}
/** First photo per city (cover preferred) for the visible diary page only. */
export async function fetchDiaryPhotos(userId: string, cityCodes: string[]): Promise<SignedMedia[]> {
  if (!cityCodes.length) return [];
  const rows = (await readAllPages((a, b) => supabase.from("visit_media").select("*").eq("user_id", userId).eq("media_type", "photo")
    .in("istat_code", cityCodes).order("created_at").order("id").range(a, b))).map(toMedia);
  const photos = firstDiaryPhotos(rows);
  const urls = await signPaths(photos.map(p => p.storage_path));
  return photos.map((p, i) => ({ ...p, url: urls[i] ?? "" }));
}
export async function fetchExperiencePreviews(userId: string, ids: string[]): Promise<ExperiencePreview[]> {
  if (!ids.length) return [];
  const rows = (await readAllPages((a, b) => supabase.from("visit_media").select("*").eq("user_id", userId).in("experience_id", ids)
    .order("created_at").order("id").range(a, b))).map(toMedia);
  return buildPreviews(ids, rows, await signPaths(firstPhotos(rows).map(p => p.storage_path)));
}
function firstPhotos(rows: Media[]) {
  const photos = new Map<string, Media>();
  for (const r of rows) if (r.experience_id && r.media_type === "photo" && !photos.has(r.experience_id)) photos.set(r.experience_id, r);
  return [...photos.values()];
}
/** Pure: counts photos/videos per experience and attaches the first photo's signed link. */
export function buildPreviews(ids: string[], rows: Media[], urls: string[]): ExperiencePreview[] {
  const selected = firstPhotos(rows);
  return ids.map(id => {
    const index = selected.findIndex(p => p.experience_id === id);
    const photo = selected[index];
    return {
      id,
      photos: rows.filter(r => r.experience_id === id && r.media_type === "photo").length,
      videos: rows.filter(r => r.experience_id === id && r.media_type === "video").length,
      photo: photo ? { ...photo, url: urls[index] ?? "" } : undefined,
    };
  });
}
/** Uploads the file under <user>/<city>/ and records it; removes the file if recording fails. */
export async function uploadMedia(input: { userId: string; istat: string; experienceId: string; file: File; kind: MediaKind; contentType: string }): Promise<void> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${input.userId}/${input.istat}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(MEDIA_BUCKET).upload(path, input.file, { contentType: input.contentType });
  if (up.error) throw up.error;
  const ins = await supabase.from("visit_media").insert({
    user_id: input.userId, istat_code: input.istat, experience_id: input.experienceId, file_name: input.file.name, media_type: input.kind, storage_path: path,
  });
  if (ins.error) { await supabase.storage.from(MEDIA_BUCKET).remove([path]); throw ins.error; }
}
export async function updateMediaCaption(id: string, caption: string | null): Promise<void> {
  const { error } = await supabase.from("visit_media").update({ caption }).eq("id", id);
  if (error) throw error;
}
/** Owner-scoped server function keeps one photo cover per city. */
export async function setCityCover(mediaId: string): Promise<void> {
  const { error } = await supabase.rpc("set_my_city_cover", { _media_id: mediaId });
  if (error) throw error;
}
/** Removes the file first; on failure the record is kept so nothing points to a missing file silently. */
export async function deleteMedia(item: Pick<Media, "id" | "storage_path">): Promise<"file" | "record" | null> {
  const st = await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
  if (st.error) return "file";
  const { error } = await supabase.from("visit_media").delete().eq("id", item.id);
  return error ? "record" : null;
}
