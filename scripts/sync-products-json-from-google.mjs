#!/usr/bin/env node
/**
 * Оновити assets/data/products.json з Google (швидкий перший візит без очікування GAS).
 * node scripts/sync-products-json-from-google.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cfgPath = path.join(root, "assets/data/config.json");
const outPath = path.join(root, "assets/data/products.json");

const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const url = (cfg.googleWebAppUrl || "").trim();
if (!url) {
  console.error("googleWebAppUrl порожній у config.json");
  process.exit(1);
}

const endpoint = `${url}${url.includes("?") ? "&" : "?"}action=get&ts=${Date.now()}`;
console.log("Завантаження з Google…");

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 120000);

let res;
try {
  res = await fetch(endpoint, { redirect: "follow", signal: controller.signal });
} catch (err) {
  clearTimeout(timer);
  console.error(err.name === "AbortError" ? "Таймаут 120 с" : err.message);
  process.exit(1);
}
clearTimeout(timer);

const data = await res.json();
if (!data.ok || !Array.isArray(data.products)) {
  console.error(data.error || "Немає products у відповіді");
  process.exit(1);
}

const rows = data.products.map((p) => {
  const row = {
    id: p.id,
    name: p.name || p.n || "",
    category: p.category || p.c || ""
  };
  if (p.price !== null && p.price !== undefined && p.price !== "") row.price = p.price;
  if (p.image || p.img) row.image = p.image || p.img;
  const st = String(p.sale_type || p.saleType || "").trim();
  if (st) row.sale_type = st;
  if (p.unit) row.unit = p.unit;
  if (p.unit_min != null) row.unit_min = p.unit_min;
  if (p.unit_step != null) row.unit_step = p.unit_step;
  return row;
});

fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n");
console.log(`OK: ${rows.length} товарів → ${path.relative(root, outPath)}`);
