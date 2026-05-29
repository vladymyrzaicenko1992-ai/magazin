#!/usr/bin/env node
/**
 * Прибрати дублі id у листі products (потрібен оновлений google-apps-script.gs).
 * node scripts/repair-google-sheet.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../assets/data/config.json"), "utf8")
);
const url = (cfg.googleWebAppUrl || "").trim();
if (!url) {
  console.error("googleWebAppUrl порожній");
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  redirect: "follow",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({ action: "repairProducts" })
});
const text = await res.text();
console.log(text);
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Не JSON. Скопіюйте scripts/google-apps-script.gs → Apps Script → Нове розгортання");
  process.exit(1);
}
if (!data.ok) {
  console.error(data.error || data);
  process.exit(1);
}
console.log("OK:", data.message || data);
