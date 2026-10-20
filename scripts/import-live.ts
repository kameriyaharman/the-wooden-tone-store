/** Runs the live-site catalogue import (see lib/live-import.ts). Data comes from the
 *  settings row uploaded via /api/import-live, or scripts/data/live-products.json. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLiveData, runLiveImport, type LiveProduct } from "../lib/live-import";

async function main() {
  let data = await loadLiveData();
  const file = join(process.cwd(), "scripts/data/live-products.json");
  if (!data && existsSync(file)) data = JSON.parse(readFileSync(file, "utf8")) as LiveProduct[];
  if (!data) { console.log("No live catalogue data uploaded yet — skipping import"); return; }
  await runLiveImport(data, { force: process.argv.includes("--force") });
}
main().then(() => process.exit(0)).catch((e) => { console.error("Live import error:", e); process.exit(0); });
