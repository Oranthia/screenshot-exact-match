// Pure provider-row → domain-contract mappers. Explicit field copies keep provider-only columns
// out of the UI and never invent values: optional dates stay null.
import type { Tables } from "@/integrations/supabase/types";
import type { City, Experience, Media, Province, Region, Visit } from "../contracts";

export const toRegion = (r: Tables<"regions">): Region => ({ code: r.code, name: r.name, slug: r.slug });
export const toProvince = (r: Tables<"provinces">): Province => ({ code: r.code, name: r.name, abbreviation: r.abbreviation, region_code: r.region_code });
export const toCity = (r: Tables<"municipalities">): City => ({
  id: r.id, istat_code: r.istat_code, official_istat_code: r.official_istat_code ?? null, name: r.name, slug: r.slug,
  province_code: r.province_code, region_code: r.region_code, coat_of_arms_url: r.coat_of_arms_url ?? null,
});
export const toVisit = (r: Tables<"user_visits">): Visit => ({
  id: r.id, user_id: r.user_id, istat_code: r.istat_code, visited: r.visited,
  visit_date: r.visit_date ?? null, notes: r.notes ?? null, updated_at: r.updated_at,
});
export const toExperience = (r: Tables<"visit_experiences">): Experience => ({
  id: r.id, user_id: r.user_id, city_id: r.city_id, istat_code: r.istat_code, title: r.title,
  visit_date: r.visit_date ?? null, notes: r.notes ?? null, created_at: r.created_at, updated_at: r.updated_at,
  legacy_source_key: r.legacy_source_key ?? null, deleting: r.deleting,
});
export const toMedia = (r: Tables<"visit_media">): Media => ({
  id: r.id, user_id: r.user_id, istat_code: r.istat_code, experience_id: r.experience_id ?? null, file_name: r.file_name,
  media_type: r.media_type, storage_path: r.storage_path, caption: r.caption ?? null, created_at: r.created_at, is_cover: r.is_cover,
});
