import type { BadgeState } from "../contracts";
import { supabase } from "./shared";

/** Server awards any newly eligible badge (never removes) and returns earned, featured and metrics. */
export async function syncBadges(): Promise<BadgeState> {
  const { data, error } = await supabase.rpc("sync_my_badges");
  if (error) throw error;
  const s = (data ?? {}) as Partial<BadgeState>;
  return { earned: s.earned ?? [], featured: s.featured ?? [], metrics: { cities: 0, regions: 0, memories: 0, ...s.metrics } };
}
export async function setFeaturedBadges(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc("set_my_featured_badges", { _ids: ids });
  if (error) throw error;
}
/** Atomic slot write: null empties the slot, an already featured badge is swapped. */
export async function setFeaturedSlot(position: number, badgeId: string | null): Promise<void> {
  const { error } = await supabase.rpc("set_my_featured_badge_slot", { _position: position, _badge_id: badgeId as string });
  if (error) throw error;
}
