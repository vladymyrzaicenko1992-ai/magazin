/**
 * Google Таблиця + Telegram-замовлення.
 *
 * Telegram — один із двох способів:
 * 1) Лист «telegram» у цій же таблиці: B1 = токен бота, B2 = chat_id (-1003933471474)
 * 2) Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *
 * Після зміни коду: Розгорнути → Нова версія веб-додатку.
 */

var SHEET_NAME = "products";
var ORDERS_SHEET = "orders";
var CART_ADDS_SHEET = "cart_adds";
var STATS_7D_SHEET = "stats_7d";

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "get";
    if (action === "get") {
      return jsonOut({ ok: true, products: readProducts() });
    }
    if (action === "ping") {
      var cfg = getTelegramConfig_();
      return jsonOut({
        ok: true,
        orders: true,
        telegram: !!cfg.token && !!cfg.chatId,
        source: cfg.source
      });
    }
    if (action === "initTelegram") {
      createTelegramSheet_();
      return jsonOut({
        ok: true,
        message:
          "Лист «telegram» готовий. Вставте токен від @BotFather у клітинку B1. Chat_id уже в B2."
      });
    }
    if (action === "chats") {
      var chats = listTelegramChats_();
      if (chats.error) return jsonOut({ ok: false, error: chats.error });
      return jsonOut({ ok: true, chats: chats });
    }
    if (action === "trending") {
      var days = parseInt(e.parameter.days, 10) || 7;
      var limit = parseInt(e.parameter.limit, 10) || 5;
      return jsonOut(getTrending_(days, limit));
    }
    return jsonOut({ ok: false, error: "Unknown action" });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (body.action === "save" && body.products) {
      writeProducts(body.products);
      return jsonOut({ ok: true, saved: body.products.length });
    }
    if (body.action === "order") {
      return jsonOut(placeOrder_(body));
    }
    if (body.action === "trackAdd") {
      return jsonOut(trackCartAdd_(body));
    }
    return jsonOut({ ok: false, error: "Unknown action" });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getProps_() {
  return PropertiesService.getScriptProperties();
}

var TELEGRAM_SHEET = "telegram";
var DEFAULT_CHAT_ID = "-1003933471474";
/** Токен @Magazine1304_bot — після /revoke оновіть тут і зробіть Нове розгортання */
var TELEGRAM_BOT_TOKEN = "8809482654:AAH6dFjlNa4ju6DIEM1D9KHwRO4HkDDPoI4";

function getTelegramConfig_() {
  var p = getProps_();
  var token = (p.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
  var chatId = (p.getProperty("TELEGRAM_CHAT_ID") || "").trim();
  if (token && chatId) {
    return { token: token, chatId: chatId, source: "properties" };
  }

  var fromSheet = readTelegramFromSheet_();
  if (fromSheet.token && fromSheet.chatId) {
    return {
      token: fromSheet.token,
      chatId: fromSheet.chatId,
      source: "sheet"
    };
  }
  if (fromSheet.token && !chatId) {
    return {
      token: fromSheet.token,
      chatId: fromSheet.chatId || DEFAULT_CHAT_ID,
      source: "sheet"
    };
  }

  token = token || fromSheet.token || TELEGRAM_BOT_TOKEN;
  chatId = chatId || fromSheet.chatId || DEFAULT_CHAT_ID;
  if (token && chatId) {
    return { token: token, chatId: chatId, source: "code" };
  }

  return { token: "", chatId: "", source: "none" };
}

function readTelegramFromSheet_() {
  try {
    var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TELEGRAM_SHEET);
    if (!sheet) return { token: "", chatId: "" };
    return {
      token: String(sheet.getRange("B1").getValue() || "").trim(),
      chatId: String(sheet.getRange("B2").getValue() || "").trim()
    };
  } catch (err) {
    Logger.log("readTelegramFromSheet: " + err);
    return { token: "", chatId: "" };
  }
}

/** Створює лист telegram (▶ або ?action=initTelegram після розгортання). */
function createTelegramSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TELEGRAM_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(TELEGRAM_SHEET);
  }
  sheet.clear();
  sheet.getRange("A1").setValue("TELEGRAM_BOT_TOKEN");
  sheet.getRange("B1").setValue("");
  sheet.getRange("A2").setValue("TELEGRAM_CHAT_ID");
  sheet.getRange("B2").setValue(DEFAULT_CHAT_ID);
  sheet.getRange("A4").setValue("Токен: @BotFather → /mybots → API Token");
  sheet.getRange("A5").setValue("Після B1 збережіть таблицю. Розгортання не потрібне.");
  return sheet;
}

/** Опційно: записує токен з TELEGRAM_BOT_TOKEN у Script Properties */
function setupTelegramProperties() {
  getProps_().setProperties({
    TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: DEFAULT_CHAT_ID
  });
  Logger.log("Telegram OK у Properties. ping?action=ping");
}

/**
 * ОДИН РАЗ: виберіть authorizeTelegram у списку → ▶ Виконати.
 * З’явиться вікно «Потрібен доступ» → Дозволити / Allow.
 * Після цього замовлення з сайту підуть у Telegram.
 */
function authorizeTelegram() {
  var cfg = getTelegramConfig_();
  if (!cfg.token || !cfg.chatId) {
    throw new Error("Немає токена або chat_id. Перевірте TELEGRAM_BOT_TOKEN у коді.");
  }
  sendTelegramMessage_(
    cfg.token,
    cfg.chatId,
    "✅ Дозвіл UrlFetchApp надано. Замовлення з vse-v-morozilke.shop працюють."
  );
  Logger.log("OK: тестове повідомлення надіслано в групу «Заказы».");
}

function listTelegramChats_() {
  var cfg = getTelegramConfig_();
  if (!cfg.token) return { error: "TELEGRAM_BOT_TOKEN не налаштовано" };
  var url =
    "https://api.telegram.org/bot" +
    cfg.token +
    "/getUpdates?limit=50";
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var data = JSON.parse(res.getContentText());
  if (!data.ok) return { error: data.description || "getUpdates failed" };
  var seen = {};
  var out = [];
  (data.result || []).forEach(function (u) {
    var chat =
      (u.message && u.message.chat) ||
      (u.channel_post && u.channel_post.chat) ||
      (u.my_chat_member && u.my_chat_member.chat);
    if (!chat || seen[chat.id]) return;
    seen[chat.id] = true;
    out.push({
      id: chat.id,
      title: chat.title || chat.first_name || "",
      type: chat.type
    });
  });
  return out;
}

function placeOrder_(body) {
  if (body.website) {
    return { ok: false, error: "Spam" };
  }

  var name = String(body.name || "").trim();
  var phone = String(body.phone || "").trim();
  var address = String(body.address || "").trim();
  var comment = String(body.comment || "").trim();
  var items = body.items || [];
  var total = Number(body.total);

  if (!name || name.length < 2) {
    return { ok: false, error: "Вкажіть ім'я" };
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Вкажіть коректний телефон" };
  }
  if (!items.length) {
    return { ok: false, error: "Кошик порожній" };
  }
  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, error: "Некоректна сума" };
  }

  var cfg = getTelegramConfig_();
  if (!cfg.token || !cfg.chatId) {
    return {
      ok: false,
      error:
        "Telegram не налаштовано. У Apps Script: функція setupTelegramProperties → вставте токен у TOKEN → ▶ Run. " +
        "Або Script Properties: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID=" +
        DEFAULT_CHAT_ID +
        ". Розгортання: «Виконувати від імені: Я»."
    };
  }

  var message = formatOrderMessage_(name, phone, address, comment, items, total);
  try {
    sendTelegramMessage_(cfg.token, cfg.chatId, message);
  } catch (err) {
    var msg = String(err);
    if (msg.indexOf("UrlFetchApp") >= 0 || msg.indexOf("external_request") >= 0) {
      return {
        ok: false,
        error:
          "Немає дозволу на Telegram. У Apps Script запустіть ▶ функцію authorizeTelegram і натисніть «Дозволити». Розгортання: виконувати від імені «Я»."
      };
    }
    throw err;
  }
  logOrder_(name, phone, address, comment, items, total);

  return { ok: true };
}

function formatOrderMessage_(name, phone, address, comment, items, total) {
  var tz = Session.getScriptTimeZone() || "Europe/Kyiv";
  var time = Utilities.formatDate(new Date(), tz, "dd.MM.yyyy HH:mm");

  var lines = [
    "🛒 НОВЕ ЗАМОВЛЕННЯ",
    "",
    "👤 Ім'я: " + name,
    "📱 Телефон: " + phone
  ];
  if (address) {
    lines.push("📍 Адреса: " + address);
  }
  lines.push("━━━━━━━━━━");

  items.forEach(function (it) {
    var qty = it.qty || it.quantity || 1;
    var title = it.name || it.n || "Товар";
    var unit = it.unitLabel || it.unit || "шт";
    var lineSum = it.lineTotal;
    var price = it.price;
    var row = "• " + title + " — " + qty + " " + unit;
    if (price !== undefined && price !== null && price !== "") {
      row += " × " + price + " грн";
    }
    if (lineSum !== undefined && lineSum !== null && lineSum !== "") {
      row += " = " + Math.round(lineSum * 100) / 100 + " грн";
    }
    lines.push(row);
  });

  lines.push("━━━━━━━━━━");
  lines.push("💰 Сума: " + Math.round(total * 100) / 100 + " грн");
  if (comment) {
    lines.push("💬 " + comment);
  }
  lines.push("🕒 " + time);
  lines.push("", "🌐 vse-v-morozilke.shop");

  return lines.join("\n");
}

function sendTelegramMessage_(token, chatId, text) {
  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: text
    }),
    muteHttpExceptions: true
  });
  var data = JSON.parse(res.getContentText());
  if (!data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }
}

function logOrder_(name, phone, address, comment, items, total) {
  try {
    var sheet = getOrdersSheet_();
    sheet.appendRow([
      new Date(),
      name,
      phone,
      address,
      JSON.stringify(items),
      total,
      comment
    ]);
  } catch (err) {
    Logger.log("logOrder: " + err);
  }
}

function getOrdersSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET);
    sheet.appendRow([
      "timestamp",
      "name",
      "phone",
      "address",
      "items_json",
      "total",
      "comment"
    ]);
  }
  return sheet;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "name", "category", "price", "image", "unit"]);
  }
  return sheet;
}

function readProducts() {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function (h) {
    return String(h).toLowerCase().trim();
  });
  var idx = {
    id: headers.indexOf("id"),
    name: headers.indexOf("name"),
    category: headers.indexOf("category"),
    price: headers.indexOf("price"),
    image: headers.indexOf("image"),
    unit: headers.indexOf("unit")
  };

  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[idx.id >= 0 ? idx.id : 0];
    if (!id) continue;
    var priceVal = idx.price >= 0 ? row[idx.price] : "";
    var unitVal = idx.unit >= 0 ? String(row[idx.unit] || "").trim().toLowerCase() : "";
    if (!unitVal) unitVal = "pcs";
    out.push({
      id: String(id),
      name: String(row[idx.name >= 0 ? idx.name : 1] || ""),
      category: String(row[idx.category >= 0 ? idx.category : 2] || ""),
      price: priceVal === "" || priceVal === null ? null : Number(priceVal),
      image: String(row[idx.image >= 0 ? idx.image : 4] || ""),
      unit: unitVal
    });
  }
  return out;
}

function writeProducts(products) {
  var sheet = getSheet_();
  sheet.clear();
  sheet.appendRow(["id", "name", "category", "price", "image", "unit"]);
  products.forEach(function (p) {
    var unit = String(p.unit || "pcs").trim().toLowerCase();
    if (!unit) unit = "pcs";
    sheet.appendRow([
      p.id || "",
      p.name || p.n || "",
      p.category || p.c || "",
      p.price === null || p.price === undefined || p.price === "" ? "" : p.price,
      p.image || p.img || "",
      unit
    ]);
  });
}

/** Лог кожного «Додати в кошик» + зведення топу за 7 днів на листі stats_7d */
function getCartAddsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CART_ADDS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CART_ADDS_SHEET);
    sheet.appendRow(["timestamp", "product_id", "product_name", "qty"]);
  }
  return sheet;
}

function getStats7dSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(STATS_7D_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STATS_7D_SHEET);
    sheet.appendRow(["rank", "product_id", "product_name", "adds_7d", "updated"]);
  }
  return sheet;
}

function trackCartAdd_(body) {
  var id = String(body.id || "").trim();
  if (!id) return { ok: false, error: "product id required" };
  var name = String(body.name || body.n || "").trim();
  var qty = Number(body.qty);
  if (!qty || qty < 1) qty = 1;

  getCartAddsSheet_().appendRow([new Date(), id, name, qty]);
  refreshStats7dSheet_();

  return { ok: true };
}

function getTrending_(days, limit) {
  days = days || 7;
  limit = limit || 5;
  var since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  var sheet = getCartAddsSheet_();
  var data = sheet.getDataRange().getValues();
  var counts = {};
  var names = {};

  for (var i = 1; i < data.length; i++) {
    var ts = data[i][0];
    var pid = String(data[i][1] || "").trim();
    if (!pid) continue;
    if (!(ts instanceof Date) || ts < since) continue;
    counts[pid] = (counts[pid] || 0) + 1;
    if (!names[pid] && data[i][2]) names[pid] = String(data[i][2]);
  }

  var ids = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a];
  });

  var trending = ids.slice(0, limit).map(function (id) {
    return { id: id, name: names[id] || "", count: counts[id] };
  });

  return { ok: true, days: days, trending: trending };
}

function refreshStats7dSheet_() {
  var result = getTrending_(7, 100);
  var sheet = getStats7dSheet_();
  var products = readProducts();
  var nameById = {};
  products.forEach(function (p) {
    nameById[p.id] = p.name;
  });

  sheet.clear();
  sheet.appendRow(["rank", "product_id", "product_name", "adds_7d", "updated"]);
  var now = new Date();
  (result.trending || []).forEach(function (row, i) {
    sheet.appendRow([
      i + 1,
      row.id,
      nameById[row.id] || row.name || "",
      row.count,
      now
    ]);
  });
}
