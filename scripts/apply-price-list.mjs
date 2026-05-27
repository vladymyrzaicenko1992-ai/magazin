#!/usr/bin/env node
/**
 * Застосовує прайс-лист до products.json і синхронізує Google Таблицю.
 * node scripts/apply-price-list.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** id → ціна з прайсу власника */
const PRICE_BY_ID = {
  "pel-bogatyr": 86,
  "pel-dom": 88,
  "pel-kurinye": 83,
  "pel-babush": 84,
  "pel-kozackie": 106,
  "pel-bulmeni": 92,
  "pel-malyshki": 86,
  "pel-vershk": 135,
  "hink-dom": 99,
  "hink-kavkaz": 101,
  "hink-shah": 106,
  "var-kapusta": 85,
  "var-myaso-chesnok": 92,
  "var-serdce-pechen": 92,
  "var-kartoshka": 78,
  "var-tvorog-sladkiy": 93,
  "bl-myaso-dom": 118,
  "bl-tvorog-dom": 115,
  "cheb-myaso-syr": 95,
  "bend-myaso": 105,
  "kot-rublen": 169,
  "kot-burger": 195,
  "shnic-dom": 155,
  "kot-sokovit": 165,
  "grechaniki": 180,
  "kordon-blu": 275,
  "kot-po-kiev-farsh": 355,
  "kot-dom-maslo": 198,
  "golubcy": 137,
  "kot-kiev-file": 138,
  "kot-syr": 138,
  "kot-sviny": 195,
  "kot-yozhik": 125,
  "kot-babush": 129,
  "naggets": 335,
  "kot-shkoln": 198,
  "tvorog": 115,
  "sirna-masa": 118,
  "smetana": 98
};

/** У прайсі, але немає на сайті (треба додати в каталог) */
const MISSING_ON_SITE = [
  { name: "Рікадельки", price: 115, category: "Котлети" },
  { name: "Котлети з печінкою", price: 220, category: "Котлети" },
  { name: "Котлети Малюки", price: 195, category: "Котлети", note: "На сайті є лише «Пельмені Малюки» (pel-malyshki)" },
  { name: "Сир Фета", price: 215, category: "Молочка" },
  { name: "Масло вершкове", price: 380, category: "Молочка" }
];

const catalogJs = fs.readFileSync(path.join(root, "assets/js/catalog.js"), "utf8");
const baseMatch = catalogJs.match(/const BASE_PRODUCTS = (\[[\s\S]*?\n\]);/);
const BASE_PRODUCTS = eval(baseMatch[1]);

const products = BASE_PRODUCTS.map((p) => {
  const price = PRICE_BY_ID[p.id] ?? null;
  const row = {
    id: p.id,
    name: p.n,
    category: p.c,
    price
  };
  if (p.img) row.image = p.img;
  return row;
});

const pricedIds = new Set(Object.keys(PRICE_BY_ID));
const onSiteNoPrice = products.filter((p) => !pricedIds.has(p.id));

const report = [
  "# Звіт синхронізації цін",
  "",
  `Оновлено: ${new Date().toLocaleString("uk-UA")}`,
  "",
  "## У прайсі → записано на сайт і в Google",
  "",
  `Товарів з ціною: **${Object.keys(PRICE_BY_ID).length}**`,
  "",
  "## На сайті, але немає в вашому прайсі (ціна не змінена)",
  "",
  ...onSiteNoPrice.map((p) => `- ${p.name} (\`${p.id}\`)`),
  "",
  "## У прайсі, але немає на сайті — треба додати",
  "",
  ...MISSING_ON_SITE.map(
    (m) => `- **${m.name}** — ${m.price} грн${m.note ? ` _(${m.note})_` : ""}`
  ),
  ""
];

fs.writeFileSync(
  path.join(root, "assets/data/products.json"),
  JSON.stringify(products, null, 2) + "\n"
);
fs.writeFileSync(path.join(root, "docs/PRICE_SYNC_REPORT.md"), report.join("\n"));

console.log("products.json оновлено:", products.filter((p) => p.price !== null).length, "з ціною");

const seed = spawnSync("node", [path.join(__dirname, "seed-google-sheet.mjs")], {
  cwd: root,
  stdio: "inherit"
});
if (seed.status !== 0) process.exit(seed.status || 1);

console.log("Звіт: docs/PRICE_SYNC_REPORT.md");
