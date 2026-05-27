/**
 * Google Таблиця + Telegram-замовлення.
 *
 * Script Properties (Проект → Налаштування → Властивості скрипта):
 *   TELEGRAM_BOT_TOKEN — від @BotFather
 *   TELEGRAM_CHAT_ID   — id групи «Заказы» (від'ємне число, напр. -100123...)
 *
 * Після зміни коду: Розгорнути → Нова версія веб-додатку.
 */

var SHEET_NAME = "products";
var ORDERS_SHEET = "orders";

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "get";
    if (action === "get") {
      return jsonOut({ ok: true, products: readProducts() });
    }
    if (action === "chats") {
      var chats = listTelegramChats_();
      if (chats.error) return jsonOut({ ok: false, error: chats.error });
      return jsonOut({ ok: true, chats: chats });
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

function getTelegramConfig_() {
  var p = getProps_();
  return {
    token: (p.getProperty("TELEGRAM_BOT_TOKEN") || "").trim(),
    chatId: (p.getProperty("TELEGRAM_CHAT_ID") || "").trim()
  };
}

/** Запустіть один раз з редактора, підставивши свої значення. */
function setupTelegramProperties() {
  getProps_().setProperties({
    TELEGRAM_BOT_TOKEN: "PASTE_BOT_TOKEN",
    TELEGRAM_CHAT_ID: "PASTE_GROUP_CHAT_ID"
  });
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
        "Telegram не налаштовано. Додайте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у Script Properties."
    };
  }

  var message = formatOrderMessage_(name, phone, comment, items, total);
  sendTelegramMessage_(cfg.token, cfg.chatId, message);
  logOrder_(name, phone, comment, items, total);

  return { ok: true };
}

function formatOrderMessage_(name, phone, comment, items, total) {
  var tz = Session.getScriptTimeZone() || "Europe/Kyiv";
  var time = Utilities.formatDate(new Date(), tz, "dd.MM.yyyy HH:mm");

  var lines = [
    "🛒 НОВЕ ЗАМОВЛЕННЯ",
    "",
    "👤 Ім'я: " + name,
    "📱 Телефон: " + phone,
    "━━━━━━━━━━"
  ];

  items.forEach(function (it) {
    var qty = it.qty || it.quantity || 1;
    var title = it.name || it.n || "Товар";
    lines.push("• " + title + " ×" + qty);
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

function logOrder_(name, phone, comment, items, total) {
  try {
    var sheet = getOrdersSheet_();
    sheet.appendRow([
      new Date(),
      name,
      phone,
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
    sheet.appendRow(["id", "name", "category", "price", "image"]);
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
    image: headers.indexOf("image")
  };

  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[idx.id >= 0 ? idx.id : 0];
    if (!id) continue;
    var priceVal = idx.price >= 0 ? row[idx.price] : "";
    out.push({
      id: String(id),
      name: String(row[idx.name >= 0 ? idx.name : 1] || ""),
      category: String(row[idx.category >= 0 ? idx.category : 2] || ""),
      price: priceVal === "" || priceVal === null ? null : Number(priceVal),
      image: String(row[idx.image >= 0 ? idx.image : 4] || "")
    });
  }
  return out;
}

function writeProducts(products) {
  var sheet = getSheet_();
  sheet.clear();
  sheet.appendRow(["id", "name", "category", "price", "image"]);
  products.forEach(function (p) {
    sheet.appendRow([
      p.id || "",
      p.name || p.n || "",
      p.category || p.c || "",
      p.price === null || p.price === undefined || p.price === "" ? "" : p.price,
      p.image || p.img || ""
    ]);
  });
}
