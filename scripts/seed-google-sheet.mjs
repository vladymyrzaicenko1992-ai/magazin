#!/usr/bin/env node
/**
 * Записує каталог з репозиторію (BASE + products.json) у Google Таблицю.
 * node scripts/seed-google-sheet.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const config = JSON.parse(
  fs.readFileSync(path.join(root, "assets/data/config.json"), "utf8")
);
const url = (config.googleWebAppUrl || "").trim();
if (!url) {
  console.error("googleWebAppUrl порожній у assets/data/config.json");
  process.exit(1);
}

const catalogJs = fs.readFileSync(
  path.join(root, "assets/js/catalog.js"),
  "utf8"
);
const baseMatch = catalogJs.match(
  /const BASE_PRODUCTS = (\[[\s\S]*?\n\]);/
);
if (!baseMatch) {
  console.error("Не знайдено BASE_PRODUCTS у catalog.js");
  process.exit(1);
}
const BASE_PRODUCTS = eval(baseMatch[1]);

const overrides = JSON.parse(
  fs.readFileSync(path.join(root, "assets/data/products.json"), "utf8")
);

function parsePrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalize(item) {
  if (!item?.id) return null;
  return {
    id: item.id,
    n: item.n || item.name || "",
    c: item.c || item.category || "",
    img: item.img || item.image || "",
    price: parsePrice(item.price)
  };
}

function mergeById(base, extra) {
  const map = new Map(base.map((p) => [p.id, { ...p }]));
  for (const raw of extra) {
    const item = normalize(raw);
    if (!item) continue;
    const prev = map.get(item.id) || normalize({ id: item.id });
    map.set(item.id, {
      ...prev,
      ...item,
      img: item.img || prev.img,
      price: item.price !== null ? item.price : prev.price
    });
  }
  return [...map.values()];
}

const catalog = mergeById(
  BASE_PRODUCTS.map(normalize).filter(Boolean),
  overrides
);

const products = catalog.map((p) => {
  const row = { id: p.id, name: p.n, category: p.c };
  if (p.price !== null) row.price = p.price;
  if (p.img) row.image = p.img;
  return row;
});

const payload = JSON.stringify({ action: "save", products });

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: payload,
  redirect: "follow"
});
const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Відповідь не JSON:", text.slice(0, 500));
  process.exit(1);
}

if (!data.ok) {
  console.error("Помилка:", data.error || data);
  process.exit(1);
}

console.log(`OK: записано ${data.saved ?? products.length} товарів у Google Таблицю`);
