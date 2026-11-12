// Domain contracts for Italia Explorer. They describe the app, not the database provider:
// UI and hooks import these, while src/data/backend maps provider rows into them.
// Date rules: visit_date is an optional user-supplied calendar day (YYYY-MM-DD) and is never
// filled with "today"; created_at / updated_at are system timestamps used only for ordering.

export interface Region { code: string; name: string; slug: string }
export interface Province { code: string; name: string; abbreviation: string; region_code: string }
export interface City {
  /** Stable internal UUID. */ id: string;
  /** Immutable legacy key used by visits and private storage paths. */ istat_code: string;
  official_istat_code: string | null;
  name: string; slug: string; province_code: string; region_code: string;
  coat_of_arms_url: string | null;
}
export interface CatalogMeta { catalogComplete: boolean; nationalTotal: number }
export interface Visit {
  id: string; user_id: string; istat_code: string; visited: boolean;
  /** Legacy read-only archive; experiences are the editable source. */ visit_date: string | null;
  /** Legacy read-only archive. */ notes: string | null;
  updated_at: string;
}
export interface VisitPatch { istat_code: string; visited?: boolean; visit_date?: string | null; notes?: string | null }
export interface Experience {
  id: string; user_id: string; city_id: string; istat_code: string; title: string;
  visit_date: string | null; notes: string | null; created_at: string; updated_at: string;
  legacy_source_key: string | null; deleting: boolean;
}
export interface ExperienceDraft { title: string; visit_date: string | null; notes: string | null }
export type MediaKind = "photo" | "video";
export interface Media {
  id: string; user_id: string; istat_code: string; experience_id: string | null;
  file_name: string; media_type: string; storage_path: string; caption: string | null;
  created_at: string; is_cover: boolean;
}
/** Media with a short-lived private link; "" means the link could not be created. */
export interface SignedMedia extends Media { url: string }
export interface ExperiencePreview { id: string; photos: number; videos: number; photo: SignedMedia | undefined }
export type { BadgeMetrics, BadgeState } from "@/lib/badges";
export interface EarnedBadge { badge_id: string; earned_at: string }
export interface FeaturedBadge { badge_id: string; position: number }
export interface UserProfile { id: string; email: string | null; displayName: string | null }
export type { Progress, RegionProgress } from "@/lib/progress";
export type ProgressStats = ReturnType<typeof import("@/lib/progress").computeProgress>;
/** Private link lifetime; caches refresh before it expires. */
export const SIGNED_URL_SECONDS = 60 * 60;
export const MEDIA_REFRESH_MS = 1000 * 60 * 45;
