import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VisitMedia } from "./queries";
import { firstDiaryPhotos } from "./diary";

export const diaryPhotosQuery = (userId: string, cityCodes: string[]) => queryOptions({
  queryKey: ["media", userId, "diary", [...cityCodes].sort()],
  staleTime: 1000 * 60 * 45,
  refetchInterval: 1000 * 60 * 45,
  queryFn: async () => {
    if (!cityCodes.length) return [];
    const rows: VisitMedia[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("visit_media").select("*")
        .eq("user_id", userId).eq("media_type", "photo").in("istat_code", cityCodes)
        .order("created_at").order("id").range(from, from + 999);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const photos = firstDiaryPhotos(rows);
    if (!photos.length) return [];
    const { data, error } = await supabase.storage.from("visit-media").createSignedUrls(photos.map(p => p.storage_path), 3600);
    if (error) throw error;
    return photos.map((photo, i) => ({ ...photo, url: data?.[i]?.error ? "" : data?.[i]?.signedUrl ?? "" }));
  },
});