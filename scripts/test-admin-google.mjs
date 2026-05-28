#!/usr/bin/env node
/**
 * Тест адмінки → Google: одиниці sale_type / unit / unit_min / unit_step.
 * node scripts/test-admin-google.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../assets/data/config.json"), "utf8")
);
const url = (cfg.googleWebAppUrl || "").trim();
const TEST_ID = "kot-babush";

if (!url) {
  console.error("FAIL: googleWebAppUrl порожній у config.json");
  process.exit(1);
}

function unitFromSaleType(saleType) {
  const id = String(saleType || "pcs").toLowerCase();
  if (id === "kg") return "kg";
  if (id === "pack") return "pack";
  return "pcs";
}

function toRow(p) {
  const saleType = String(p.sale_type || p.saleType || "pcs").toLowerCase();
  const unit = unitFromSaleType(saleType);
  return {
    id: p.id,
    name: p.name || p.n,
    category: p.category || p.c,
    sale_type: saleType,
    unit,
    unit_min: p.unit_min ?? p.unitMin ?? (unit === "kg" ? 0.1 : 1),
    unit_step: p.unit_step ?? p.unitStep ?? (unit === "kg" ? 0.1 : 1),
    price: p.price,
    image: p.image || p.img || ""
  };
}

async function getProducts() {
  const res = await fetch(`${url}?action=get&ts=${Date.now()}`, { redirect: "follow" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "action=get failed");
  return data.products || [];
}

async function saveProducts(products) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "save", products: products.map(toRow) })
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("save: не JSON — " + text.slice(0, 120));
  }
  if (!data.ok) throw new Error(data.error || "save failed");
  return data;
}

let failed = 0;
function ok(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

console.log("URL:", url);

const ping = await fetch(`${url}?action=ping`, { redirect: "follow" }).then((r) => r.json());
if (!ping.ok) {
  fail("ping: " + (ping.error || "not ok"));
  process.exit(1);
}
ok(`ping telegram=${ping.telegram} source=${ping.source || "?"}`);

const products = await getProducts();
if (!products.length) {
  fail("каталог порожній");
  process.exit(1);
}
ok(`завантажено ${products.length} товарів`);

const target = products.find((p) => p.id === TEST_ID);
if (!target) {
  fail(`немає тестового товару ${TEST_ID}`);
  process.exit(1);
}

const original = {
  sale_type: target.sale_type,
  unit: target.unit,
  unit_min: target.unit_min,
  unit_step: target.unit_step
};

const want = { sale_type: "kg", unit: "kg", unit_min: 0.1, unit_step: 0.1 };
const alt =
  original.sale_type === "kg"
    ? { sale_type: "pcs", unit: "pcs", unit_min: 1, unit_step: 1 }
    : want;

const idx = products.findIndex((p) => p.id === TEST_ID);
products[idx] = { ...products[idx], ...alt };

await saveProducts(products);
ok(`записано ${TEST_ID} → ${alt.sale_type} / ${alt.unit}`);

const after = (await getProducts()).find((p) => p.id === TEST_ID);
if (!after) {
  fail("товар зник після save");
} else if (after.sale_type !== alt.sale_type || after.unit !== alt.unit) {
  fail(
    `одиниці в Google: очікувалось ${alt.sale_type}/${alt.unit}, отримано ${after.sale_type}/${after.unit}`
  );
} else if (Number(after.unit_min) !== alt.unit_min) {
  fail(`unit_min: очікувалось ${alt.unit_min}, отримано ${after.unit_min}`);
} else {
  ok(
    `перевірка Google: sale_type=${after.sale_type} unit=${after.unit} unit_min=${after.unit_min} unit_step=${after.unit_step}`
  );
}

products[idx] = { ...products[idx], ...original };
await saveProducts(products);
ok(`відкочено ${TEST_ID} → ${original.sale_type}`);

if (failed) process.exit(1);
console.log("\nУсі перевірки пройдені.");
