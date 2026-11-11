/**
 * Importazione comuni dai dati ufficiali ISTAT.
 *
 * 1. Scarica "Elenco comuni italiani" da https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/
 *    (file CSV, separatore ";", codifica Latin-1). Se hai l'XLSX, salvalo come CSV ";".
 * 2. Esegui:  bun scripts/import-istat.ts Elenco-comuni-italiani.csv > /tmp/istat.sql
 * 3. Applica lo SQL generato come migrazione del database (chiedilo a Lovable).
 *
 * Lo script genera INSERT ... ON CONFLICT per province e comuni, mantenendo il codice
 * ISTAT come stringa a 6 cifre (zeri iniziali preservati), e alla fine marca il catalogo
 * come completo, così l'app smette di indicare le statistiche come dimostrative.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Uso: bun scripts/import-istat.ts <file.csv>");
  process.exit(1);
}
const text = new TextDecoder("latin1").decode(readFileSync(file));
const rows = text.split(/\r?\n/).filter(Boolean).map((l) => l.split(";").map((c) => c.replace(/^"|"$/g, "").trim()));
const header = rows.shift()!.map((h) => h.toLowerCase());
const col = (needle: string) => {
  const i = header.findIndex((h) => h.includes(needle));
  if (i < 0) throw new Error(`Colonna non trovata: ${needle}`);
  return i;
};
const iRegion = col("codice regione");
const iProv = col("unità territoriale sovracomunale");
const iIstat = col("codice comune formato alfanumerico");
const iName = col("denominazione in italiano");
const iProvName = header.findIndex((h) => h.startsWith("denominazione dell'unità territoriale"));
const iSigla = col("sigla automobilistica");

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const provinces = new Map<string, string>();
const munis: string[] = [];
const slugs = new Set<string>();
for (const r of rows) {
  const region = r[iRegion].padStart(2, "0");
  const prov = r[iProv].padStart(3, "0");
  const istat = r[iIstat].padStart(6, "0");
  const name = r[iName];
  provinces.set(prov, `(${q(prov)}, ${q(r[iProvName] ?? r[iSigla])}, ${q(r[iSigla])}, ${q(region)})`);
  let slug = slugify(name);
  if (slugs.has(slug)) slug = `${slug}-${r[iSigla].toLowerCase()}`;
  slugs.add(slug);
  munis.push(`(${q(istat)}, ${q(name)}, ${q(prov)}, ${q(region)}, ${q(slug)})`);
}

console.log(`INSERT INTO public.provinces (code, name, abbreviation, region_code) VALUES\n${[...provinces.values()].join(",\n")}\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, abbreviation = EXCLUDED.abbreviation, region_code = EXCLUDED.region_code;`);
console.log(`INSERT INTO public.municipalities (istat_code, name, province_code, region_code, slug) VALUES\n${munis.join(",\n")}\nON CONFLICT (istat_code) DO UPDATE SET name = EXCLUDED.name, province_code = EXCLUDED.province_code, region_code = EXCLUDED.region_code;`);
console.log(`UPDATE public.catalog_meta SET is_complete = true, national_total = ${munis.length} WHERE id = 1;`);
