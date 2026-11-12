import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { setFeaturedBadges, syncBadges } from "@/data/backend";
import { validateFeatured, type BadgeState } from "./badges";

export const badgesQuery = (userId: string) => queryOptions({
  queryKey: ["badges", userId],
  staleTime: Infinity,
  queryFn: (): Promise<BadgeState> => syncBadges(),
});
export function useFeaturedBadges(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const state = qc.getQueryData(badgesQuery(userId).queryKey);
      validateFeatured(ids, state?.earned.map(b => b.badge_id) ?? []);
      await setFeaturedBadges(ids);
    },
    onSuccess: (_data, ids) => {
      qc.setQueryData<BadgeState>(badgesQuery(userId).queryKey, old => old ? { ...old, featured: ids.map((badge_id, i) => ({ badge_id, position: i + 1 })) } : old);
    },
  });
}