// Provider-specific helpers shared by the backend adapters. Only src/data/backend talks to the client.
import { supabase } from "@/integrations/supabase/client";
import { SIGNED_URL_SECONDS } from "../contracts";

export { supabase };
export const MEDIA_BUCKET = "visit-media";
export const PAGE = 1000;

/** Reads every page; callers must order by a unique tie-breaker (Data API caps at 1000 rows). */
export async function readAllPages<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

/** Creates private signed links in input order; missing links become "" unless strict. */
export async function signPaths(paths: string[], strict = false): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  if (strict && (data ?? []).some(i => i.error || !i.signedUrl)) throw new Error("Impossibile caricare alcuni ricordi.");
  return paths.map((_, i) => (data?.[i]?.error ? "" : data?.[i]?.signedUrl ?? ""));
}
