import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { optimisticVisit, type VisitPatch } from "./visit-cache";

export type Region = Tables<"regions">;
export type Province = Tables<"provinces">;
export type Municipality = Tables<"municipalities">;
export type Visit = Tables<"user_visits">;
export type VisitMedia = Tables<"visit_media">;

async function fetchAll<T>(table: "municipalities"): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from(table).select("*").order("name").range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

export const geoQuery = queryOptions({
  queryKey: ["geo"],
  staleTime: 1000 * 60 * 30,
  queryFn: async () => {
    const [regions, provinces, meta, municipalities] = await Promise.all([
      supabase.from("regions").select("*").order("name"),
      supabase.from("provinces").select("*"),
      supabase.from("catalog_meta").select("*").maybeSingle(),
      fetchAll<Municipality>("municipalities"),
    ]);
    if (regions.error) throw regions.error;
    if (provinces.error) throw provinces.error;
    return {
      regions: regions.data,
      provinces: provinces.data,
      provinceByCode: new Map(provinces.data.map((p) => [p.code, p])),
      regionByCode: new Map(regions.data.map((r) => [r.code, r])),
      municipalities,
      catalogComplete: meta.data?.is_complete ?? false,
      nationalTotal: meta.data?.national_total ?? 7896,
    };
  },
});

export const visitsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["visits", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_visits").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export function useSaveVisit(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: VisitPatch) => {
      const { data, error } = await supabase
        .from("user_visits")
        .upsert({ user_id: userId, ...v }, { onConflict: "user_id,istat_code" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
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
      qc.setQueryData<Visit[]>(["visits", userId], (old) => {
        const rest = (old ?? []).filter((x) => x.istat_code !== row.istat_code);
        return [row, ...rest];
      });
    },
  });
}

export const mediaQuery = (userId: string, istat: string) =>
  queryOptions({
    queryKey: ["media", userId, istat],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_media")
        .select("*")
        .eq("istat_code", istat)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data.length) return [];
      const { data: signed, error: sErr } = await supabase.storage
        .from("visit-media")
        .createSignedUrls(data.map((m) => m.storage_path), 60 * 60);
      if (sErr) throw sErr;
      return data.map((m, i) => ({ ...m, url: signed?.[i]?.signedUrl ?? "" }));
    },
  });
