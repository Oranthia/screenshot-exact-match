import type { CatalogMeta, City, Province, Region } from "../contracts";
import { readAllPages, supabase } from "./shared";
import { toCity, toProvince, toRegion } from "./mappers";

export async function fetchCatalog(): Promise<{ regions: Region[]; provinces: Province[]; cities: City[] } & CatalogMeta> {
  const [regions, provinces, meta, cities] = await Promise.all([
    supabase.from("regions").select("*").order("name"),
    supabase.from("provinces").select("*"),
    supabase.from("catalog_meta").select("*").maybeSingle(),
    readAllPages((a, b) => supabase.from("municipalities").select("*").order("name").order("istat_code").range(a, b)),
  ]);
  if (regions.error) throw regions.error;
  if (provinces.error) throw provinces.error;
  if (meta.error) throw meta.error;
  return {
    regions: (regions.data ?? []).map(toRegion), provinces: (provinces.data ?? []).map(toProvince), cities: cities.map(toCity),
    catalogComplete: meta.data?.is_complete ?? false, nationalTotal: meta.data?.national_total ?? 7896,
  };
}
