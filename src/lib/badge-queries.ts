import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateFeatured, type BadgeState } from "./badges";

export const badgesQuery = (userId: string) => queryOptions({
  queryKey: ["badges", userId],
  staleTime: Infinity,
  queryFn: async (): Promise<BadgeState> => {
    const { data, error } = await supabase.rpc("sync_my_badges");
    if (error) throw error;
    return data as unknown as BadgeState;
  },
});
export function useFeaturedBadges(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const state = qc.getQueryData(badgesQuery(userId).queryKey);
      validateFeatured(ids, state?.earned.map(b => b.badge_id) ?? []);
      const { error } = await supabase.rpc("set_my_featured_badges", { _ids: ids });
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      qc.setQueryData<BadgeState>(badgesQuery(userId).queryKey, old => old ? { ...old, featured: ids.map((badge_id, i) => ({ badge_id, position: i + 1 })) } : old);
    },
  });
}