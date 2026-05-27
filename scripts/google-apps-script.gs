/**
 * Google Таблиця на Диску — сховище каталогу магазину.
 *
 * 1. Створіть Google Таблицю (Файл → Новая → Google Таблицы).
 * 2. Розширення → Apps Script, вставте цей код, збережіть.
 * 3. Розгорнути → Новое развертывание → Веб-приложение.
 *    - Выполнять от имени: Я
 *    - Доступ: Все (Anyone)
 * 4. Скопіюйте URL веб-додатку в admin.html (поле Google).
 */

var SHEET_NAME = "products";

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "get";
    if (action === "get") {
      return jsonOut({ ok: true, products: readProducts() });
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
