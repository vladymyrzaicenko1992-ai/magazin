#!/usr/bin/env node
/**
 * Тест замовлення через Google Apps Script (без сервера).
 * node scripts/test-order-gas.mjs
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

const pingUrl = `${url}${url.includes("?") ? "&" : "?"}action=ping`;
const pingRes = await fetch(pingUrl);
const ping = await pingRes.json();
console.log("ping:", ping);
if (!ping.ok || !ping.orders) {
  console.error("Спочатку розгорніть новий scripts/google-apps-script.gs");
  process.exit(1);
}
if (!ping.telegram) {
  console.error("Додайте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у Script Properties");
  process.exit(1);
}

const body = JSON.stringify({
  action: "order",
  name: "Тест GAS",
  phone: "+380955301343",
  comment: "перевірка з test-order-gas.mjs",
  website: "",
  items: [{ name: "Тестовий товар", qty: 1, price: 1 }],
  total: 1
});

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body,
  redirect: "follow"
});
const text = await res.text();
console.log("order:", text);
