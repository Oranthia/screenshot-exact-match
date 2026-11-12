import { queryOptions } from "@tanstack/react-query";
import { fetchDiaryPhotos } from "@/data/backend";
import { MEDIA_REFRESH_MS } from "@/data/contracts";

export const diaryPhotosQuery = (userId: string, cityCodes: string[]) => queryOptions({
  queryKey: ["media", userId, "diary", [...cityCodes].sort()],
  staleTime: MEDIA_REFRESH_MS,
  refetchInterval: MEDIA_REFRESH_MS,
  queryFn: () => fetchDiaryPhotos(userId, cityCodes),
});
