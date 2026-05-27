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

var TELEGRAM_SHEET = "telegram";
var DEFAULT_CHAT_ID = "-1003933471474";

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

  return {
    token: token || fromSheet.token,
    chatId: chatId || fromSheet.chatId,
    source: token || chatId ? "partial" : "none"
  };
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

/**
 * НАЙПРОСТІШЕ: вставте токен у TOKEN нижче → виберіть setupTelegramProperties → ▶ Виконати.
 * Після успіху видаліть токен з цього файлу (Ctrl+S). Розгортання не потрібне.
 */
function setupTelegramProperties() {
  var TOKEN = "ВСТАВТЕ_ТОКЕН_ВІД_BOTFATHER_СЮДИ";
  if (TOKEN.indexOf("ВСТАВТЕ") >= 0 || TOKEN.length < 30) {
    throw new Error(
      "Відкрийте setupTelegramProperties у редакторі, замініть TOKEN на токен від @BotFather, натисніть ▶ Run."
    );
  }
  getProps_().setProperties({
    TELEGRAM_BOT_TOKEN: TOKEN.trim(),
    TELEGRAM_CHAT_ID: DEFAULT_CHAT_ID
  });
  Logger.log("Telegram OK. Перевірте веб: .../exec?action=ping");
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
        "Telegram не налаштовано. У Apps Script: функція setupTelegramProperties → вставте токен у TOKEN → ▶ Run. " +
        "Або Script Properties: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID=" +
        DEFAULT_CHAT_ID +
        ". Розгортання: «Виконувати від імені: Я»."
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
