import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCatalog, fetchMedia, fetchVisits, saveVisit } from "@/data/backend";
import type { City, Media, Province, Region, Visit } from "@/data/contracts";
import { MEDIA_REFRESH_MS } from "@/data/contracts";
import { optimisticVisit, type VisitPatch } from "./visit-cache";

export type { Region, Province, Visit };
export type Municipality = City;
export type VisitMedia = Media;

export const geoQuery = queryOptions({
  queryKey: ["geo"],
  staleTime: 1000 * 60 * 30,
  queryFn: async () => {
    const { regions, provinces, cities, catalogComplete, nationalTotal } = await fetchCatalog();
    return {
      regions,
      provinces,
      provinceByCode: new Map(provinces.map((p) => [p.code, p])),
      regionByCode: new Map(regions.map((r) => [r.code, r])),
      municipalities: cities,
      catalogComplete,
      nationalTotal,
    };
  },
});

export const visitsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["visits", userId],
    queryFn: () => fetchVisits(userId),
  });

export function useSaveVisit(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: VisitPatch) => saveVisit(userId, v),
    onMutate: async (patch) => {
      const key = ["visits", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Visit[]>(key);
      qc.setQueryData<Visit[]>(key, optimisticVisit(previous ?? [], userId, patch));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      qc.setQueryData(["visits", userId], context?.previous ?? []);
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["badges", userId] });
      qc.setQueryData<Visit[]>(["visits", userId], (old) => {
        const rest = (old ?? []).filter((x) => x.istat_code !== row.istat_code);
        return [row, ...rest];
      });
    },
  });
}

export const mediaQuery = (userId: string, istat: string, experienceId?: string) =>
  queryOptions({
    queryKey: ["media", userId, istat, experienceId ?? "all"],
    staleTime: MEDIA_REFRESH_MS,
    refetchInterval: MEDIA_REFRESH_MS,
    queryFn: () => fetchMedia(userId, istat, experienceId),
  });
