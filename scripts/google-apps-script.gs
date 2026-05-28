/**
 * =============================================================================
 *  УСЕ В МОРОЗИЛЦІ — Google Apps Script (веб-додаток для сайту)
 * =============================================================================
 *
 * Підключення: Розширення → Apps Script → вставити цей файл → Зберегти.
 *
 * РОЗГОРТАННЯ (обовʼязково після кожної зміни коду):
 *   Розгорнути → Керувати розгортаннями → Нове розгортання
 *   Тип: Веб-додаток
 *   Виконувати від імені: Я
 *   Хто має доступ: Усі (навіть анонімні)
 *
 * URL вставити в assets/data/config.json → googleWebAppUrl
 *
 * TELEGRAM (один із варіантів):
 *   1) Лист «telegram»: B1 = токен від @BotFather, B2 = chat_id групи (-100…)
 *   2) Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   3) Один раз ▶ authorizeTelegram (дозвіл UrlFetchApp)
 *
 * API (GET):
 *   ?action=get          — каталог products
 *   ?action=ping         — перевірка Telegram
 *   ?action=trending     — топ додавань у кошик (&days=7&limit=5)
 *   ?action=dashboard    — панель адміна (замовлення сьогодні, топ)
 *   ?action=initTelegram — створити лист telegram
 *   ?action=chats        — список chat_id з getUpdates
 *
 * API (POST JSON):
 *   action: save      + products[]  — зберегти каталог
 *   action: order     + name, phone, items[], total  — замовлення → Telegram
 *   action: trackAdd  + id, name, qty, unit, sale_type  — статистика кошика
 *
 * Листи таблиці (створюються автоматично):
 *   products, orders, cart_adds, stats_7d, unit_metrics, telegram
 * =============================================================================
 */

var SHEET_NAME = "products";
var ORDERS_SHEET = "orders";
var CART_ADDS_SHEET = "cart_adds";
var STATS_7D_SHEET = "stats_7d";
var UNIT_METRICS_SHEET = "unit_metrics";
var TELEGRAM_SHEET = "telegram";

/** Chat_id групи «Заказы» — за замовчуванням */
var DEFAULT_CHAT_ID = "-1003933471474";

/** Не зберігайте токен у Git. Краще: лист telegram B1 або Script Properties */
var TELEGRAM_BOT_TOKEN = "";

var DEFAULT_UNIT_METRICS = {
  pcs: { label: "шт", step: 1, min: 1 },
  kg: { label: "кг", step: 0.1, min: 0.1 },
  pack: { label: "уп", step: 1, min: 1 }
};

// ----------------------------------------------------------------------------- doGet / doPost
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
          "Лист «telegram» готовий. B1 = токен бота, B2 = chat_id групи."
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
    if (action === "dashboard") {
      return jsonOut(getDashboard_());
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

// ----------------------------------------------------------------------------- Telegram
function getProps_() {
  return PropertiesService.getScriptProperties();
}

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

  token = token || fromSheet.token || String(TELEGRAM_BOT_TOKEN || "").trim();
  chatId = chatId || fromSheet.chatId || DEFAULT_CHAT_ID;
  if (token && chatId) {
    return { token: token, chatId: chatId, source: token === TELEGRAM_BOT_TOKEN ? "code" : "sheet" };
  }

  return { token: "", chatId: "", source: "none" };
}

function readTelegramFromSheet_() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TELEGRAM_SHEET);
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

function createTelegramSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TELEGRAM_SHEET);
  if (!sheet) sheet = ss.insertSheet(TELEGRAM_SHEET);
  sheet.clear();
  sheet.getRange("A1").setValue("TELEGRAM_BOT_TOKEN");
  sheet.getRange("B1").setValue("");
  sheet.getRange("A2").setValue("TELEGRAM_CHAT_ID");
  sheet.getRange("B2").setValue(DEFAULT_CHAT_ID);
  sheet.getRange("A4").setValue("Токен: @BotFather → /newbot або /mybots → API Token");
  sheet.getRange("A5").setValue("Бот має бути в групі «Заказы» як адмін.");
  return sheet;
}

/** ▶ Run один раз: записує токен/chat_id у Script Properties (підставте TOKEN нижче перед Run) */
function setupTelegramProperties() {
  var token = String(TELEGRAM_BOT_TOKEN || readTelegramFromSheet_().token || "").trim();
  if (!token) {
    throw new Error("Вкажіть токен у B1 листа telegram або в TELEGRAM_BOT_TOKEN у коді.");
  }
  getProps_().setProperties({
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_CHAT_ID: DEFAULT_CHAT_ID
  });
  Logger.log("OK: Telegram у Properties. Перевірте ?action=ping");
}

/** ▶ Run один раз — дозвіл на відправку в Telegram */
function authorizeTelegram() {
  var cfg = getTelegramConfig_();
  if (!cfg.token || !cfg.chatId) {
    throw new Error("Немає токена або chat_id. Заповніть лист telegram (B1, B2).");
  }
  sendTelegramMessage_(
    cfg.token,
    cfg.chatId,
    "✅ Дозвіл UrlFetchApp надано. Замовлення з vse-v-morozilke.shop працюють."
  );
  Logger.log("OK: тест надіслано в Telegram.");
}

function listTelegramChats_() {
  var cfg = getTelegramConfig_();
  if (!cfg.token) return { error: "TELEGRAM_BOT_TOKEN не налаштовано" };
  var url = "https://api.telegram.org/bot" + cfg.token + "/getUpdates?limit=50";
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

// ----------------------------------------------------------------------------- Orders
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
        "Telegram не налаштовано. Заповніть лист telegram (B1 токен, B2 chat_id) " +
        "і запустіть authorizeTelegram. Розгортання: «Виконувати від імені: Я»."
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
          "Немає дозволу на Telegram. Запустіть ▶ authorizeTelegram → Дозволити."
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

  var lines = ["🛒 Нове замовлення", ""];
  var hasEstimated = false;

  items.forEach(function (it) {
    var qty = it.qty || it.quantity || 1;
    var title = it.name || it.n || "Товар";
    var unit = it.unitLabel || it.unit || "шт";
    var lineSum = it.lineTotal;
    var estimated = !!it.estimated;
    if (estimated) hasEstimated = true;
    var row = "• " + title + " — " + qty + " " + unit;
    if (lineSum !== undefined && lineSum !== null && lineSum !== "") {
      row += " = " + (estimated ? "≈ " : "") + Math.round(lineSum * 100) / 100 + " грн";
    }
    lines.push(row);
  });

  lines.push("");
  lines.push((hasEstimated ? "≈ Сума: " : "Сума: ") + Math.round(total * 100) / 100 + " грн");
  if (hasEstimated) {
    lines.push("ℹ️ Фінальна сума може відрізнятись через вагові товари.");
  }
  lines.push("");
  lines.push("Ім'я: " + name);
  lines.push("Телефон: " + phone);
  if (address) lines.push("📍 Адреса: " + address);
  if (comment) lines.push("💬 " + comment);
  lines.push("🕒 " + time);
  lines.push("🌐 vse-v-morozilke.shop");

  return lines.join("\n");
}

function logOrder_(name, phone, address, comment, items, total) {
  try {
    getOrdersSheet_().appendRow([
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

function countOrdersToday_() {
  try {
    var sheet = getOrdersSheet_();
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return 0;
    var tz = Session.getScriptTimeZone() || "Europe/Kyiv";
    var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var n = 0;
    for (var i = 1; i < data.length; i++) {
      var ts = data[i][0];
      if (!ts) continue;
      if (Utilities.formatDate(new Date(ts), tz, "yyyy-MM-dd") === today) n++;
    }
    return n;
  } catch (err) {
    return 0;
  }
}

function getDashboard_() {
  var cfg = getTelegramConfig_();
  var trending = getTrending_(7, 5);
  var top = (trending.trending || []).map(function (r) {
    return { id: r.id, name: r.name, adds: r.count || 0 };
  });
  return {
    ok: true,
    ordersToday: countOrdersToday_(),
    productsCount: readProducts().length,
    telegram: !!cfg.token && !!cfg.chatId,
    telegramSource: cfg.source || "",
    trending: top
  };
}

// ----------------------------------------------------------------------------- Products
function unitFromSaleType_(saleType) {
  var st = String(saleType || "pcs").trim().toLowerCase();
  if (st === "kg") return "kg";
  if (st === "pack") return "pack";
  return "pcs";
}

function ensureUnitMetricsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(UNIT_METRICS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(UNIT_METRICS_SHEET);
    sheet.appendRow(["unit", "label", "step", "min"]);
    sheet.appendRow(["pcs", "шт", 1, 1]);
    sheet.appendRow(["kg", "кг", 0.1, 0.1]);
    sheet.appendRow(["pack", "уп", 1, 1]);
  }
  return sheet;
}

function getUnitMetricsMap_() {
  ensureUnitMetricsSheet_();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNIT_METRICS_SHEET);
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var key in DEFAULT_UNIT_METRICS) {
    if (DEFAULT_UNIT_METRICS.hasOwnProperty(key)) {
      map[key] = DEFAULT_UNIT_METRICS[key];
    }
  }
  if (data.length < 2) return map;
  var headers = data[0].map(function (h) {
    return String(h).toLowerCase().trim();
  });
  var iUnit = headers.indexOf("unit");
  var iLabel = headers.indexOf("label");
  var iStep = headers.indexOf("step");
  var iMin = headers.indexOf("min");
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var unit = String(row[iUnit >= 0 ? iUnit : 0] || "").trim().toLowerCase();
    if (!unit) continue;
    map[unit] = {
      label: String(row[iLabel >= 0 ? iLabel : 1] || unit),
      step: Number(row[iStep >= 0 ? iStep : 2]) || 1,
      min: Number(row[iMin >= 0 ? iMin : 3]) || 1
    };
  }
  return map;
}

function metricsForUnit_(unit, unitMin, unitStep) {
  var map = getUnitMetricsMap_();
  var m = map[unit] || DEFAULT_UNIT_METRICS.pcs;
  var min = unitMin === "" || unitMin === null || unitMin === undefined ? m.min : Number(unitMin);
  var step = unitStep === "" || unitStep === null || unitStep === undefined ? m.step : Number(unitStep);
  if (!min || isNaN(min)) min = m.min;
  if (!step || isNaN(step)) step = m.step;
  return { min: min, step: step, label: m.label || unit };
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "id",
      "name",
      "category",
      "price",
      "image",
      "sale_type",
      "unit",
      "unit_min",
      "unit_step"
    ]);
  }
  ensureUnitMetricsSheet_();
  return sheet;
}

function readProducts() {
  ensureUnitMetricsSheet_();
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
    unit: headers.indexOf("unit"),
    saleType: headers.indexOf("sale_type"),
    unitMin: headers.indexOf("unit_min"),
    unitStep: headers.indexOf("unit_step"),
    saleOptions: headers.indexOf("sale_options")
  };

  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[idx.id >= 0 ? idx.id : 0];
    if (!id) continue;
    var priceVal = idx.price >= 0 ? row[idx.price] : "";
    var saleTypeVal = idx.saleType >= 0 ? String(row[idx.saleType] || "").trim().toLowerCase() : "";
    if (!saleTypeVal && idx.saleOptions >= 0) {
      saleTypeVal = String(row[idx.saleOptions] || "")
        .split(",")[0]
        .trim()
        .toLowerCase();
    }
    if (!saleTypeVal) {
      var unitVal = idx.unit >= 0 ? String(row[idx.unit] || "").trim().toLowerCase() : "";
      saleTypeVal = unitVal === "kg" ? "kg" : unitVal === "pack" ? "pack" : "pcs";
    }
    var unit = unitFromSaleType_(saleTypeVal);
    var unitMinVal = idx.unitMin >= 0 ? row[idx.unitMin] : "";
    var unitStepVal = idx.unitStep >= 0 ? row[idx.unitStep] : "";
    var metrics = metricsForUnit_(unit, unitMinVal, unitStepVal);
    out.push({
      id: String(id),
      name: String(row[idx.name >= 0 ? idx.name : 1] || ""),
      category: String(row[idx.category >= 0 ? idx.category : 2] || ""),
      price: priceVal === "" || priceVal === null ? null : Number(priceVal),
      image: String(row[idx.image >= 0 ? idx.image : 4] || ""),
      sale_type: saleTypeVal,
      unit: unit,
      unit_min: metrics.min,
      unit_step: metrics.step
    });
  }
  return out;
}

function writeProducts(products) {
  ensureUnitMetricsSheet_();
  var sheet = getSheet_();
  sheet.clear();
  sheet.appendRow([
    "id",
    "name",
    "category",
    "price",
    "image",
    "sale_type",
    "unit",
    "unit_min",
    "unit_step"
  ]);
  (products || []).forEach(function (p) {
    var saleType = String(p.sale_type || p.saleType || "").trim().toLowerCase();
    var unit = unitFromSaleType_(saleType || p.unit);
    if (!saleType) saleType = unit === "kg" ? "kg" : unit === "pack" ? "pack" : "pcs";
    var metrics = metricsForUnit_(unit, p.unit_min, p.unit_step);
    sheet.appendRow([
      p.id || "",
      p.name || p.n || "",
      p.category || p.c || "",
      p.price === null || p.price === undefined || p.price === "" ? "" : p.price,
      p.image || p.img || "",
      saleType,
      unit,
      metrics.min,
      metrics.step
    ]);
  });
}

// ----------------------------------------------------------------------------- Cart stats
function getCartAddsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CART_ADDS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CART_ADDS_SHEET);
    sheet.appendRow(["timestamp", "product_id", "product_name", "qty", "unit", "sale_type"]);
    return sheet;
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var h = headers.map(function (x) {
    return String(x).toLowerCase().trim();
  });
  if (h.indexOf("unit") < 0) {
    sheet.getRange(1, headers.length + 1).setValue("unit");
    sheet.getRange(1, headers.length + 2).setValue("sale_type");
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

  var unit = String(body.unit || "").trim().toLowerCase();
  var saleType = String(body.sale_type || body.saleType || "").trim().toLowerCase();
  if (!saleType && unit) {
    saleType = unit === "kg" ? "kg" : unit === "pack" ? "pack" : "pcs";
  }
  if (!unit && saleType) unit = unitFromSaleType_(saleType);

  getCartAddsSheet_().appendRow([new Date(), id, name, qty, unit, saleType]);
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
