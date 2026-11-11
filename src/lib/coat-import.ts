export type CoatAssociation = { istat_code: string; coat_of_arms_url: string };

/** Validate all associations before producing any database writes. */
export function prepareCoatImport(input: unknown): string {
  if (!Array.isArray(input) || input.length === 0) throw new Error("La lista degli stemmi è vuota o non valida.");
  const seen = new Set<string>();
  const rows = input.map((row: unknown) => {
    if (!row || typeof row !== "object" || !("istat_code" in row) || !("coat_of_arms_url" in row)) {
      throw new Error("Ogni immagine deve avere istat_code e coat_of_arms_url.");
    }
    const { istat_code: code, coat_of_arms_url: url } = row;
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) throw new Error("Il codice ISTAT deve essere una stringa di 6 cifre.");
    if (seen.has(code)) throw new Error(`Codice ISTAT duplicato: ${code}`);
    seen.add(code);
    if (typeof url !== "string") throw new Error(`URL mancante per ${code}`);
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error(`URL non valido per ${code}`); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error(`Serve un URL HTTPS senza credenziali per ${code}`);
    const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
    return `(${q(code)}, ${q(url)})`;
  });
  return `BEGIN;
CREATE TEMP TABLE coat_import (istat_code text PRIMARY KEY, coat_of_arms_url text NOT NULL) ON COMMIT DROP;
INSERT INTO coat_import VALUES\n${rows.join(",\n")};
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM coat_import i LEFT JOIN public.municipalities m USING (istat_code) WHERE m.istat_code IS NULL) THEN
    RAISE EXCEPTION 'Importazione annullata: codice ISTAT non presente nel catalogo';
  END IF;
END $$;
UPDATE public.municipalities m SET coat_of_arms_url = i.coat_of_arms_url
FROM coat_import i WHERE m.istat_code = i.istat_code AND NULLIF(btrim(m.coat_of_arms_url), '') IS NULL
RETURNING m.istat_code, m.name, m.coat_of_arms_url;
COMMIT;`;
}