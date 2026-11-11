/** Generate validated data-import SQL; apply using Lovable's data tools, not migrations. */
import { readFileSync } from "node:fs";
import { prepareCoatImport } from "../src/lib/coat-import";

const file = process.argv[2];
if (!file) {
  console.error("Uso: bun scripts/import-coats.ts <associazioni.json>");
  process.exit(1);
}
try {
  console.log(prepareCoatImport(JSON.parse(readFileSync(file, "utf8"))));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Importazione non valida.");
  process.exit(1);
}