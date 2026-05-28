const STORAGE_KEY = "magazin-products-v2";
const LEGACY_STORAGE_KEY = "magazin-products-v1";
const DELETED_KEY = "magazin-deleted-v2";
const GOOGLE_URL_KEY = "magazin-google-webapp-url";

let cachedSiteConfig = null;

const PRODUCT_UNITS = [
  { id: "pcs", label: "Штуки (шт)" },
  { id: "kg", label: "Кілограми (кг)" },
  { id: "g", label: "Грами (г)" },
  { id: "l", label: "Літри (л)" },
  { id: "ml", label: "Мілілітри (мл)" },
  { id: "pack", label: "Упаковки (уп)" }
];

const SALE_TYPES = [
  { id: "kg", label: "⚖️ кг", unit: "kg" },
  { id: "pcs", label: "🥟 шт", unit: "pcs" },
  { id: "pack", label: "📦 уп", unit: "pack" }
];

const UNIT_METRICS = {
  pcs: { short: "шт", step: 1, min: 1 },
  kg: { short: "кг", step: 0.1, min: 0.1 },
  pack: { short: "уп", step: 1, min: 1 }
};

function unitFromSaleType(saleType) {
  const id = String(saleType || "pcs").toLowerCase();
  if (id === "kg") return "kg";
  if (id === "pack") return "pack";
  return "pcs";
}

function getPrimarySaleType(product) {
  const raw = product?.sale_type || product?.saleType;
  if (raw && SALE_TYPES.some((s) => s.id === String(raw).toLowerCase())) {
    return String(raw).toLowerCase();
  }
  const types = normalizeSaleTypes(product?.saleTypes || product?.sale_options, product?.c, product?.unit);
  return types[0] || unitFromSaleType(product?.unit);
}

function getUnitMetrics(unitId) {
  return UNIT_METRICS[unitId] || UNIT_METRICS.pcs;
}

const CATEGORY_PRESETS = [
  "Вареники",
  "Млинці",
  "Додатково",
  "Котлети",
  "Пельмені",
  "Хінкалі",
  "Молочка"
];

function normalizeUnit(value) {
  const id = String(value || "pcs").trim().toLowerCase();
  return PRODUCT_UNITS.some((u) => u.id === id) ? id : "pcs";
}

function inferSaleTypes(category) {
  if (category === "Котлети") return ["kg", "pcs"];
  if (category === "Пельмені" || category === "Вареники" || category === "Хінкалі") return ["pack"];
  if (category === "Молочка") return ["kg", "pack"];
  return ["pcs"];
}

function normalizeSaleTypes(value, category, fallbackUnit) {
  const raw = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
  const normalized = raw
    .map((x) => String(x).toLowerCase())
    .filter((x) => SALE_TYPES.some((s) => s.id === x));
  if (normalized.length) return Array.from(new Set(normalized));
  if (fallbackUnit === "kg") return ["kg"];
  if (fallbackUnit === "pack") return ["pack"];
  return inferSaleTypes(category || "");
}

function getCategoryList(products) {
  const set = new Set(CATEGORY_PRESETS);
  (products || []).forEach((p) => {
    const c = (p && (p.c || p.category)) || "";
    if (c.trim()) set.add(c.trim());
  });
  return Array.from(set).sort((a, b) => {
    const ia = CATEGORY_PRESETS.indexOf(a);
    const ib = CATEGORY_PRESETS.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, "uk");
  });
}

const BASE_PRODUCTS = [
  { id: "var-kartoshka", n: "Вареники з картоплею", c: "Вареники", img: "assets/img/products/vareniki/Вареники з картоплею.png", price: null },
  { id: "var-kapusta", n: "Вареники з капустою", c: "Вареники", img: "assets/img/products/vareniki/Вареники з капустою.png", price: null },
  { id: "var-serdce-pechen", n: "Вареники з серцем і печінкою", c: "Вареники", img: "assets/img/products/vareniki/Вареники з серцем-печінкою.png", price: null },
  { id: "var-myaso-chesnok", n: "Вареники з м'ясом і часником", c: "Вареники", img: "assets/img/products/vareniki/Вареники з м'ясом та часником.png", price: null },
  { id: "var-tvorog-sladkiy", n: "Вареники з солодким сиром", c: "Вареники", img: "assets/img/products/vareniki/Вареники з солодким творогом.png", price: null },
  { id: "bl-myaso-dom", n: "Млинці домашні з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png", price: null },
  { id: "bl-tvorog-dom", n: "Млинці домашні з сиром", c: "Млинці", img: "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png", price: null },
  { id: "bend-myaso", n: "Бендерики з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png", price: null },
  { id: "bend-kapusta", n: "Бендерики з капустою", c: "Млинці", img: "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png", price: null },
  { id: "cheb-myaso-syr", n: "Чебуреки з м'ясом і сиром", c: "Млинці", img: "assets/img/products/bliny/Чебуреки (з м'ясом та сиром).png", price: null },
  { id: "syrniki-zhar", n: "Сирники смажені", c: "Млинці", img: "assets/img/products/bliny/Сирники смажені.png", price: null },
  { id: "zrazy-myas-kap", n: "Зрази смажені", c: "Млинці", img: "assets/img/products/vareniki/Зрази смажені (з м'ясом , капустою).png", price: null },
  { id: "sosiska-v-teste", n: "Сосиска в тісті", c: "Млинці", img: "assets/img/products/bliny/Сосиска в тісті.png", price: null },
  { id: "gnizdechka-myaso", n: "Гніздечка з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Гніздечка з м'ясом.png", price: null },
  { id: "ovoshi-zamorozh", n: "Заморожені овочі", c: "Додатково", img: "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png", price: null },
  { id: "kartoplya-fri", n: "Картопля фрі", c: "Додатково", img: "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png", price: null },
  { id: "kot-babush", n: "Котлети «Бабусині»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).png", price: null },
  { id: "kot-yozhik", n: "Котлети «Їжачок»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Їжачок» (курка).png", price: null },
  { id: "kot-syr", n: "Котлети з сиром", c: "Котлети", img: "assets/img/products/cutlets/Котлети «З сиром» (яловичина + сир).png", price: null },
  { id: "kot-po-kiev-farsh", n: "Котлети по-київськи", c: "Котлети", img: "assets/img/products/cutlets/Котлети «По-київськи» (курячий фарш + масло + зелень).png", price: null },
  { id: "kot-sviny", n: "Котлети зі свинини", c: "Котлети", img: "assets/img/products/cutlets/Котлети зі свинини.png", price: null },
  { id: "kot-shkoln", n: "Котлети «Шкільні»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Шкільні» (курка).png", price: null },
  { id: "naggets", n: "Курячі нагетси", c: "Котлети", img: "assets/img/products/cutlets/Нагетси курячі.png", price: null },
  { id: "rikadelki", n: "Рікадельки", c: "Котлети", img: "", price: null },
  { id: "kot-pechen", n: "Котлети з печінкою", c: "Котлети", img: "", price: null },
  { id: "kot-malyshki", n: "Котлети «Малюки»", c: "Котлети", img: "", price: null },
  { id: "grechaniki", n: "Гречаники", c: "Котлети", img: "assets/img/products/cutlets/Гречаники домашні (свинина + яловичина + гречка).png", price: null },
  { id: "kot-kiev-file", n: "Котлети «Київські»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Київські» (філе + масло + зелень).png", price: null },
  { id: "kordon-blu", n: "Кордон-блю", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Кордон-Блю» (філе + шинка + сир).png", price: null },
  { id: "kot-sokovit", n: "Котлети «Соковиті»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Соковиті» (яловичина + курка).png", price: null },
  { id: "kot-dom-maslo", n: "Котлети «Домашні»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Домашні» (свинина + яловичина + масло).png", price: null },
  { id: "shnic-dom", n: "Домашній шніцель", c: "Котлети", img: "assets/img/products/cutlets/Шніцель домашній (яловичина).png", price: null },
  { id: "kot-burger", n: "Котлети для бургерів", c: "Котлети", img: "assets/img/products/cutlets/Котлети для бургерів (яловичина).png", price: null },
  { id: "kot-rublen", n: "Рублені котлети", c: "Котлети", img: "assets/img/products/cutlets/Котлети рублені (свинина + яловичина + курка).png", price: null },
  { id: "golubcy", n: "Голубці", c: "Котлети", img: "assets/img/products/cutlets/Голубці (свинина + яловичина).png", price: null },
  { id: "perec-farsh", n: "Фарширований перець", c: "Котлети", img: "assets/img/products/cutlets/Перець фарширований (свинина + яловичина).png", price: null },
  { id: "pel-bogatyr", n: "Пельмені «Богатирські»", c: "Пельмені", img: "assets/img/products/dumplings/Богатирські (Яловичина + курка).png", price: null },
  { id: "pel-bulmeni", n: "Бульмені", c: "Пельмені", img: "assets/img/products/dumplings/Бульмені (Яловичина + бульйон).png", price: null },
  { id: "pel-dom", n: "Пельмені «Домашні»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Домашні» (свинина).jpg", price: null },
  { id: "pel-kozackie", n: "Пельмені «Козацькі»", c: "Пельмені", img: "assets/img/products/dumplings/Козацькі (Свинина + яловичина).png", price: null },
  { id: "pel-kurinye", n: "Пельмені «Курячі»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Курячі».jpg", price: null },
  { id: "pel-malyshki", n: "Пельмені «Малюки»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Малюки» .png", price: null },
  { id: "pel-babush", n: "Пельмені «Бабусині»", c: "Пельмені", img: "assets/img/products/dumplings/Бабусині (Свинина + яловичина + курка).png", price: null },
  { id: "pel-vershk", n: "Пельмені «Вершкові»", c: "Пельмені", img: "assets/img/products/dumplings/Вершкові (Свинина + яловичина + вершкове масло).png", price: null },
  { id: "ravioli", n: "Равіолі", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Равіолі» .png", price: null },
  { id: "hink-dom", n: "Хінкалі «Домашні»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Домашні» .png", price: null },
  { id: "hink-kavkaz", n: "Хінкалі «Кавказькі»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Кавказькі» (яловичина + курка + зелень + паприка + базилік).png", price: null },
  { id: "hink-shah", n: "Хінкалі «Шах»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Шах» (свинина + яловичина + зелень).png", price: null },
  { id: "smetana", n: "Фермерська сметана", c: "Молочка", img: "assets/img/products/molochka/Сметана фермерська.png", price: null },
  { id: "tvorog", n: "Домашній сир", c: "Молочка", img: "assets/img/products/molochka/Творог домашній .png", price: null },
  { id: "sirna-masa", n: "Сирна маса з родзинками", c: "Молочка", img: "assets/img/products/molochka/Сирна маса з родзинками .png", price: null },
  { id: "sir-feta", n: "Сир Фета", c: "Молочка", img: "", price: null },
  { id: "maslo-vershk", n: "Масло вершкове", c: "Молочка", img: "", price: null },
  { id: "yaitsa", n: "Яйця фермерські", c: "Додатково", img: "assets/img/products/qw/яйця.jpg", price: null }
];

function parsePrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeProduct(item) {
  if (!item || !item.id) return null;
  const c = item.c || item.category || "";
  const saleType = getPrimarySaleType(item);
  const unit = unitFromSaleType(saleType);
  const metrics = getUnitMetrics(unit);
  const unitMin = parsePrice(item.unit_min ?? item.unitMin);
  const unitStep = parsePrice(item.unit_step ?? item.unitStep);
  return {
    id: item.id,
    n: item.n || item.name || "",
    c,
    img: item.img || item.image || "",
    price: parsePrice(item.price),
    unit,
    saleType,
    saleTypes: [saleType],
    unitMin: unitMin !== null ? unitMin : metrics.min,
    unitStep: unitStep !== null ? unitStep : metrics.step
  };
}

function mergeById(base, overrides) {
  const map = new Map(base.map((p) => [p.id, { ...p }]));
  for (const raw of overrides) {
    const item = normalizeProduct(raw);
    if (!item) continue;
    const prev = map.get(item.id) || normalizeProduct({ id: item.id });
    map.set(item.id, {
      ...prev,
      ...item,
      img: item.img || prev.img,
      price: item.price !== null ? item.price : prev.price,
      unit: item.unit ? unitFromSaleType(item.saleType || item.unit) : prev.unit,
      saleType: item.saleType || prev.saleType,
      saleTypes: [item.saleType || prev.saleType],
      unitMin: item.unitMin !== null && item.unitMin !== undefined ? item.unitMin : prev.unitMin,
      unitStep: item.unitStep !== null && item.unitStep !== undefined ? item.unitStep : prev.unitStep
    });
  }
  return Array.from(map.values());
}

function loadDeletedIds() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
  } catch (_) {
    return [];
  }
}

function saveDeletedIds(ids) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
  } catch (_) {}
}

function markDeleted(id) {
  const ids = loadDeletedIds();
  if (!ids.includes(id)) ids.push(id);
  saveDeletedIds(ids);
}

function clearDeletedIds() {
  localStorage.removeItem(DELETED_KEY);
}

function applyDeletedFilter(catalog) {
  const deleted = new Set(loadDeletedIds());
  return catalog.filter((p) => !deleted.has(p.id));
}

function migrateLegacyStorage() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy || localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, legacy);
  } catch (_) {}
}

function loadFromStorage() {
  try {
    migrateLegacyStorage();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(normalizeProduct).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function saveToStorage(products) {
  const canonical = BASE_PRODUCTS.map(normalizeProduct).filter(Boolean);
  const full = mergeById(canonical, products);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch (_) {}
  return full;
}

async function fetchCatalogJson(url) {
  const res = await fetch(`${url || "assets/data/products.json"}?v=${Date.now()}`);
  if (!res.ok) return [];
  return (await res.json()).map(normalizeProduct).filter(Boolean);
}

async function fetchSiteConfig() {
  if (cachedSiteConfig) return cachedSiteConfig;
  try {
    const res = await fetch(`assets/data/config.json?v=${Date.now()}`);
    cachedSiteConfig = res.ok ? await res.json() : {};
  } catch (_) {
    cachedSiteConfig = {};
  }
  return cachedSiteConfig;
}

async function getGoogleWebAppUrl() {
  try {
    const fromBrowser = localStorage.getItem(GOOGLE_URL_KEY);
    if (fromBrowser && fromBrowser.trim()) return fromBrowser.trim();
  } catch (_) {}
  const cfg = await fetchSiteConfig();
  return (cfg.googleWebAppUrl || "").trim();
}

function setGoogleWebAppUrl(url) {
  try {
    localStorage.setItem(GOOGLE_URL_KEY, String(url || "").trim());
  } catch (_) {}
}

async function fetchFromGoogle(url) {
  const endpoint = `${url}${url.includes("?") ? "&" : "?"}action=get&ts=${Date.now()}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Помилка читання Google");
  return (data.products || []).map(normalizeProduct).filter(Boolean);
}

async function fetchTrending(url, limit, days) {
  const lim = limit || 5;
  const d = days || 7;
  const endpoint =
    `${url}${url.includes("?") ? "&" : "?"}action=trending&days=${d}&limit=${lim}&ts=${Date.now()}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Помилка читання топу");
  return data.trending || [];
}

async function trackCartAdd(url, product, qty) {
  const id = product && product.id;
  if (!url || !id) return;
  const saleType = getPrimarySaleType(product);
  const unit = unitFromSaleType(saleType);
  const payload = JSON.stringify({
    action: "trackAdd",
    id,
    name: product.n || product.name || "",
    qty: qty || 1,
    unit,
    sale_type: saleType
  });
  try {
    await fetch(url, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      body: payload,
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
  } catch (err) {
    console.warn("trackCartAdd:", err);
  }
}

async function saveToGoogle(url, products) {
  const payload = JSON.stringify({
    action: "save",
    products: toProductsJson(products)
  });
  const res = await fetch(url, {
    method: "POST",
    mode: "cors",
    redirect: "follow",
    body: payload,
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("Google не повернув JSON. Перевірте URL і доступ веб-додатку.");
  }
  if (!data.ok) throw new Error(data.error || "Помилка запису в Google");
  return data;
}

async function loadCatalog() {
  const canonical = BASE_PRODUCTS.map(normalizeProduct).filter(Boolean);
  let catalog = mergeById(canonical, []);

  const googleUrl = await getGoogleWebAppUrl();
  let usedGoogle = false;
  let fromGoogle = [];

  if (googleUrl) {
    try {
      fromGoogle = await fetchFromGoogle(googleUrl);
      if (fromGoogle.length) {
        catalog = mergeById(catalog, fromGoogle);
        usedGoogle = true;
      }
    } catch (err) {
      console.warn("Google catalog load failed:", err);
    }
  }

  if (!googleUrl) {
    try {
      const fromJson = await fetchCatalogJson();
      if (fromJson.length) catalog = mergeById(catalog, fromJson);
    } catch (_) {}

    const fromStorage = loadFromStorage();
    if (fromStorage.length) catalog = mergeById(catalog, fromStorage);
  } else if (!usedGoogle) {
    const fromStorage = loadFromStorage();
    if (fromStorage.length) catalog = mergeById(catalog, fromStorage);
  }

  if (usedGoogle && fromGoogle.length) {
    catalog = mergeById(catalog, fromGoogle);
  }

  catalog = mergeById(canonical, catalog);
  catalog = applyDeletedFilter(catalog);

  if (!usedGoogle) {
    try {
      const stored = loadFromStorage();
      if (stored.length < canonical.length) {
        saveToStorage(mergeById(canonical, stored));
      }
    } catch (_) {}
  }

  return catalog;
}

function formatPrice(price) {
  const value = parsePrice(price);
  if (value === null) return "";
  return `${value.toFixed(2)} грн`;
}

function toProductsJson(products) {
  return products.map((p) => {
    const row = {
      id: p.id,
      name: p.n,
      category: p.c,
      sale_type: p.saleType,
      unit: p.unit,
      unit_min: p.unitMin,
      unit_step: p.unitStep
    };
    if (p.price !== null) row.price = p.price;
    if (p.img) row.image = p.img;
    return row;
  });
}

function downloadProductsJson(products, filename) {
  const blob = new Blob([JSON.stringify(toProductsJson(products), null, 2) + "\n"], {
    type: "application/json"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || "products.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function restoreAllProducts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (_) {}
  clearDeletedIds();
}

window.MagazinCatalog = {
  STORAGE_KEY,
  GOOGLE_URL_KEY,
  BASE_PRODUCTS,
  PRODUCT_UNITS,
  SALE_TYPES,
  UNIT_METRICS,
  CATEGORY_PRESETS,
  normalizeUnit,
  normalizeSaleTypes,
  getPrimarySaleType,
  unitFromSaleType,
  getUnitMetrics,
  getCategoryList,
  parsePrice,
  normalizeProduct,
  mergeById,
  loadFromStorage,
  saveToStorage,
  fetchCatalogJson,
  loadCatalog,
  formatPrice,
  toProductsJson,
  downloadProductsJson,
  markDeleted,
  clearDeletedIds,
  restoreAllProducts,
  loadDeletedIds,
  getGoogleWebAppUrl,
  setGoogleWebAppUrl,
  fetchFromGoogle,
  fetchTrending,
  trackCartAdd,
  saveToGoogle
};
