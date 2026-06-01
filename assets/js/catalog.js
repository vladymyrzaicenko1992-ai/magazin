const STORAGE_KEY = "magazin-products-v2";
const LEGACY_STORAGE_KEY = "magazin-products-v1";
const DELETED_KEY = "magazin-deleted-v2";
const GOOGLE_URL_KEY = "magazin-google-webapp-url";
const CATALOG_CACHE_KEY = "magazin-catalog-cache-v1";
const VISITOR_KEY = "magazin-visitor-seen-catalog";
/** Кеш каталогу з Google (хв) — без нього кожне відкриття чекає 30–90 с на Apps Script */
const CATALOG_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const GOOGLE_FETCH_TIMEOUT_MS = 28000;
const GOOGLE_SAVE_TIMEOUT_MS = 120000;
const GOOGLE_ADMIN_LOAD_TIMEOUT_MS = 90000;

let cachedSiteConfig = null;
let catalogRefreshPromise = null;

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
  "Молочка",
  "Вода та напої",
  "Бакалія",
  "Чай та кава",
  "Консервація та соуси"
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

const CATEGORY_ORDER_KEY = "magazin-category-order-v1";
let categoryOrderFromFile = null;
let categoryOrderReady = null;

function defaultCategorySort(names) {
  return names.slice().sort((a, b) => {
    const ia = CATEGORY_PRESETS.indexOf(a);
    const ib = CATEGORY_PRESETS.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, "uk");
  });
}

function sortNamesByOrder(names, order) {
  const set = new Set(names);
  const out = [];
  const seen = new Set();
  (order || []).forEach((name) => {
    const c = String(name || "").trim();
    if (!c || !set.has(c) || seen.has(c)) return;
    seen.add(c);
    out.push(c);
  });
  defaultCategorySort(names.filter((n) => !seen.has(n))).forEach((c) => out.push(c));
  return out;
}

function getEffectiveCategoryOrder() {
  try {
    const raw = localStorage.getItem(CATEGORY_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed.map((x) => String(x).trim()).filter(Boolean);
    }
  } catch (_) {}
  if (Array.isArray(categoryOrderFromFile) && categoryOrderFromFile.length) {
    return categoryOrderFromFile.map((x) => String(x).trim()).filter(Boolean);
  }
  return null;
}

function ensureCategoryOrderReady() {
  if (!categoryOrderReady) {
    categoryOrderReady = fetch("assets/data/category-order.json?v=41")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) categoryOrderFromFile = data;
      })
      .catch(() => {});
  }
  return categoryOrderReady;
}

function collectCategoryNames(products) {
  const set = new Set(CATEGORY_PRESETS);
  (products || []).forEach((p) => {
    const c = (p && (p.c || p.category)) || "";
    if (c.trim()) set.add(c.trim());
  });
  return Array.from(set);
}

function getCategoryList(products) {
  const all = collectCategoryNames(products);
  const order = getEffectiveCategoryOrder();
  return order ? sortNamesByOrder(all, order) : defaultCategorySort(all);
}

/** Повний список для редагування в адмінці (включно з порожніми категоріями в порядку) */
function getAdminCategoryOrder(products) {
  const fromProducts = collectCategoryNames(products);
  const saved = getEffectiveCategoryOrder();
  const all = new Set(fromProducts);
  if (saved) saved.forEach((c) => all.add(c));
  const order = saved && saved.length ? saved : defaultCategorySort(Array.from(all));
  return sortNamesByOrder(Array.from(all), order);
}

function getStoreCategoryOrder(products) {
  return ["Усі", ...getCategoryList(products)];
}

function setCategoryOrder(order) {
  const clean = (order || []).map((x) => String(x).trim()).filter(Boolean);
  try {
    localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(clean));
  } catch (_) {}
  return clean;
}

function resetCategoryOrder() {
  try {
    localStorage.removeItem(CATEGORY_ORDER_KEY);
  } catch (_) {}
}

function downloadCategoryOrderJson(order, filename) {
  const list = order || getEffectiveCategoryOrder() || CATEGORY_PRESETS.slice();
  const blob = new Blob([JSON.stringify(list, null, 2) + "\n"], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || "category-order.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function countProductsPerCategory(products) {
  const counts = {};
  (products || []).forEach((p) => {
    const c = (p && p.c) || "Без категорії";
    counts[c] = (counts[c] || 0) + 1;
  });
  return counts;
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
  { id: "maslo-vershk", n: "Масло вершкове", c: "Молочка", img: "assets/img/products/molochka/Масло вершкове.jpg", price: null },
  { id: "yaitsa", n: "Яйця фермерські", c: "Додатково", img: "assets/img/products/qw/яйця.jpg", price: null },
  { id: "voda-avalon", n: "Вода мінеральна «Avalon»", c: "Вода та напої", img: "", price: 26 },
  { id: "voda-karpatska", n: "Вода мінеральна «Карпатська Джерельна»", c: "Вода та напої", img: "", price: 18 },
  { id: "voda-znamenivska", n: "Вода мінеральна «Знаменівська»", c: "Вода та напої", img: "", price: 25 },
  { id: "napiy-krash", n: "Напій соковмісний «Краш» (в асортименті)", c: "Вода та напої", img: "", price: 35 },
  {
    id: "napiy-bon-gaz-velykyy",
    n: "Напій газований «Бон Буассон / Соковинка» (великий)",
    c: "Вода та напої",
    img: "",
    price: 52
  },
  { id: "napiy-bon-gaz-malyy", n: "Напій газований «Бон Буассон» (малий)", c: "Вода та напої", img: "", price: 20 },
  { id: "kvas-kola", n: "Квас / Кола (в асортименті)", c: "Вода та напої", img: "", price: 25 },
  { id: "makaron-chervona", n: "Макаронні вироби (червона упаковка)", c: "Бакалія", img: "", price: 24 },
  { id: "tsukrova-pudra-dobryk", n: "Цукрова пудра «Добрик»", c: "Бакалія", img: "", price: 36 },
  { id: "chay-curtis-richard", n: "Чай Curtis / Richard (в асортименті)", c: "Чай та кава", img: "", price: 1.9 },
  { id: "ketchup-chumak", n: "Кетчуп / соус «Чумак» (універсальний)", c: "Консервація та соуси", img: "", price: 21 },
  { id: "konservy-rybni-chervona", n: "Консерви рибні (червона баночка)", c: "Консервація та соуси", img: "", price: 11 },
  { id: "konservy-rybni-synia", n: "Консерви рибні (синя баночка)", c: "Консервація та соуси", img: "", price: 16 }
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
  const res = await fetch(`${url || "assets/data/products.json"}?v=40`);
  if (!res.ok) return [];
  return (await res.json()).map(normalizeProduct).filter(Boolean);
}

async function fetchSiteConfig() {
  if (cachedSiteConfig) return cachedSiteConfig;
  try {
    const sess = sessionStorage.getItem("magazin-site-config");
    if (sess) {
      cachedSiteConfig = JSON.parse(sess);
      return cachedSiteConfig;
    }
  } catch (_) {}
  try {
    const res = await fetch("assets/data/config.json?v=44");
    cachedSiteConfig = res.ok ? await res.json() : {};
    try {
      sessionStorage.setItem("magazin-site-config", JSON.stringify(cachedSiteConfig));
    } catch (_) {}
  } catch (_) {
    cachedSiteConfig = {};
  }
  return cachedSiteConfig;
}

async function getGoogleWebAppUrl() {
  const cfg = await fetchSiteConfig();
  const fromConfig = (cfg.googleWebAppUrl || "").trim();
  if (fromConfig) {
    try {
      const fromBrowser = (localStorage.getItem(GOOGLE_URL_KEY) || "").trim();
      if (fromBrowser && fromBrowser !== fromConfig) {
        localStorage.setItem(GOOGLE_URL_KEY, fromConfig);
      }
    } catch (_) {}
    return fromConfig;
  }
  try {
    const fromBrowser = localStorage.getItem(GOOGLE_URL_KEY);
    if (fromBrowser && fromBrowser.trim()) return fromBrowser.trim();
  } catch (_) {}
  return "";
}

function setGoogleWebAppUrl(url) {
  try {
    localStorage.setItem(GOOGLE_URL_KEY, String(url || "").trim());
  } catch (_) {}
}

function readCatalogCache() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const products = (parsed.products || []).map(normalizeProduct).filter(Boolean);
    if (!products.length) return null;
    return { ts: Number(parsed.ts) || 0, products };
  } catch (_) {
    return null;
  }
}

function writeCatalogCache(products) {
  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), products: dedupeProductsById(products) })
    );
  } catch (_) {}
}

function isCatalogCacheFresh(ts) {
  return ts && Date.now() - ts < CATALOG_CACHE_TTL_MS;
}

function hasLocalCatalogSnapshot() {
  const cache = readCatalogCache();
  if (cache && cache.products.length && isCatalogCacheFresh(cache.ts)) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0;
  } catch (_) {
    return false;
  }
}

function isFirstCatalogVisit() {
  try {
    return localStorage.getItem(VISITOR_KEY) !== "1";
  } catch (_) {
    return true;
  }
}

function markCatalogVisited() {
  try {
    localStorage.setItem(VISITOR_KEY, "1");
  } catch (_) {}
}

/** Тексти екрана завантаження (variant: "store" | "cart") */
function getCatalogLoadMessages(variant) {
  const first = isFirstCatalogVisit() && !hasLocalCatalogSnapshot();
  const slowSub =
    "Перший захід на сайт може тривати до 1–2 хвилин — зараз підтягуємо каталог і ціни. Не закривайте сторінку. Наступні відкриття будуть набагато швидшими.";
  if (variant === "cart") {
    return {
      firstVisit: first,
      text: "Збираємо кошик…",
      sub: first
        ? slowSub
        : "Підтягуємо ціни та одиниці — зазвичай кілька секунд"
    };
  }
  return {
    firstVisit: first,
    text: "Завантажуємо товари…",
    sub: first ? slowSub : "Підтягуємо ціни — зазвичай кілька секунд"
  };
}

async function fetchFromGoogle(url, timeoutMs) {
  const ms = timeoutMs === undefined ? GOOGLE_FETCH_TIMEOUT_MS : timeoutMs;
  const endpoint = `${url}${url.includes("?") ? "&" : "?"}action=get&ts=${Date.now()}`;
  const opts = { redirect: "follow" };
  if (ms > 0 && typeof AbortController !== "undefined") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    opts.signal = controller.signal;
    try {
      const res = await fetch(endpoint, opts);
      clearTimeout(timer);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Помилка читання Google");
      return (data.products || []).map(normalizeProduct).filter(Boolean);
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === "AbortError") {
        throw new Error("Google не відповів вчасно (таймаут). Показуємо збережений каталог.");
      }
      throw err;
    }
  }
  const res = await fetch(endpoint, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Помилка читання Google");
  return (data.products || []).map(normalizeProduct).filter(Boolean);
}

function mergeCatalogLayers(layers) {
  const canonical = BASE_PRODUCTS.map(normalizeProduct).filter(Boolean);
  let catalog = mergeById(canonical, []);
  layers.forEach((layer) => {
    if (layer && layer.length) catalog = mergeById(catalog, layer);
  });
  catalog = mergeById(canonical, catalog);
  return applyDeletedFilter(catalog);
}

function dispatchCatalogUpdated(products) {
  try {
    window.dispatchEvent(
      new CustomEvent("magazin-catalog-updated", { detail: { products } })
    );
  } catch (_) {}
}

function refreshCatalogFromGoogle(url) {
  if (!url) return Promise.resolve(null);
  if (catalogRefreshPromise) return catalogRefreshPromise;
  catalogRefreshPromise = (async () => {
    try {
      const fromGoogle = await fetchFromGoogle(url, GOOGLE_FETCH_TIMEOUT_MS);
      if (!fromGoogle.length) return null;
      writeCatalogCache(fromGoogle);
      try {
        saveToStorage(fromGoogle);
      } catch (_) {}
      const catalog = mergeCatalogLayers([fromGoogle]);
      dispatchCatalogUpdated(catalog);
      return catalog;
    } catch (err) {
      console.warn("Фонове оновлення каталогу з Google:", err);
      return null;
    } finally {
      catalogRefreshPromise = null;
    }
  })();
  return catalogRefreshPromise;
}

async function fetchDashboard(url) {
  const endpoint = `${url}${url.includes("?") ? "&" : "?"}action=dashboard&ts=${Date.now()}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Помилка dashboard");
  return data;
}

async function fetchTrending(url, limit, days) {
  const lim = limit || 5;
  const d = days || 7;
  const endpoint =
    `${url}${url.includes("?") ? "&" : "?"}action=trending&days=${d}&limit=${lim}&ts=${Date.now()}`;
  const opts = { redirect: "follow" };
  if (typeof AbortController !== "undefined") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    opts.signal = controller.signal;
    try {
      const res = await fetch(endpoint, opts);
      clearTimeout(timer);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Помилка читання топу");
      return data.trending || [];
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === "AbortError") return [];
      throw err;
    }
  }
  const res = await fetch(endpoint, opts);
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

function dedupeProductsById(products) {
  const map = new Map();
  (products || []).forEach((p) => {
    if (!p || !p.id) return;
    map.set(p.id, p);
  });
  return Array.from(map.values());
}

async function repairGoogleSheet(url) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "repairProducts" })
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("repair: не JSON — оновіть Apps Script і зробіть Нове розгортання");
  }
  if (!data.ok) throw new Error(data.error || data.message || "repair failed");
  return data;
}

async function saveToGoogle(url, products, options) {
  const timeoutMs =
    options && options.timeoutMs !== undefined ? options.timeoutMs : GOOGLE_SAVE_TIMEOUT_MS;
  const unique = dedupeProductsById(products);
  const payload = JSON.stringify({
    action: "save",
    products: toProductsJson(unique)
  });
  const opts = {
    method: "POST",
    mode: "cors",
    redirect: "follow",
    body: payload,
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  };
  if (timeoutMs > 0 && typeof AbortController !== "undefined") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    opts.signal = controller.signal;
    try {
      const res = await fetch(url, opts);
      clearTimeout(timer);
      return parseSaveToGoogleResponse(res, url, unique);
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === "AbortError") {
        throw new Error(
          "Запис у Google не встиг завершитись (таймаут). Спробуйте «Синхронізувати в Google» ще раз."
        );
      }
      throw err;
    }
  }
  const res = await fetch(url, opts);
  return parseSaveToGoogleResponse(res, url, unique);
}

async function parseSaveToGoogleResponse(res, url, unique) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error(
      "Google не повернув JSON після запису. Перевірте URL, розгортання Apps Script і доступ «Усі»."
    );
  }
  if (!data.ok) throw new Error(data.error || "Помилка запису в Google");
  writeCatalogCache(unique);
  try {
    await clearProductsCacheOnServer_(url);
  } catch (_) {}
  return { ...data, sent: unique.length };
}

async function verifyProductOnGoogle(url, productId, expectedSnapshot) {
  const list = await fetchFromGoogle(url, GOOGLE_ADMIN_LOAD_TIMEOUT_MS);
  const remote = productSnapshot(list.find((p) => p.id === productId));
  if (!remote) {
    throw new Error(`Після збереження товар «${productId}» не знайдено в Google Таблиці.`);
  }
  if (!snapshotsMatch(expectedSnapshot, remote)) {
    const unitLbl =
      expectedSnapshot.saleType === "kg"
        ? "кг"
        : expectedSnapshot.saleType === "pack"
          ? "уп"
          : "шт";
    throw new Error(
      `У таблиці інші дані: «${remote.n}», ${remote.saleType} (${unitLbl}), ціна ${remote.price ?? "—"}. ` +
        `Очікувалось: «${expectedSnapshot.n}», ${expectedSnapshot.saleType}, ціна ${expectedSnapshot.price ?? "—"}.`
    );
  }
  return remote;
}

/** Адмінка: завжди читаємо Google (не застарілий localStorage). */
async function loadCatalogForAdmin() {
  await ensureCategoryOrderReady();
  const url = await getGoogleWebAppUrl();
  if (!url) {
    return loadCatalog();
  }
  const fromGoogle = await fetchFromGoogle(url, GOOGLE_ADMIN_LOAD_TIMEOUT_MS);
  if (!fromGoogle.length) {
    throw new Error("Google повернув порожній каталог. Перевірте лист products і URL веб-додатку.");
  }
  writeCatalogCache(fromGoogle);
  try {
    saveToStorage(fromGoogle);
  } catch (_) {}
  return mergeCatalogLayers([fromGoogle]);
}

function applyGoogleCatalogLocally(catalog) {
  writeCatalogCache(catalog);
  try {
    saveToStorage(catalog);
  } catch (_) {}
  dispatchCatalogUpdated(catalog);
  return catalog;
}

function clearProductsCacheOnServer_(url) {
  if (!url) return Promise.resolve();
  return fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "invalidateProductsCache" })
  }).catch(() => {});
}

async function loadCatalog() {
  const googleUrl = await getGoogleWebAppUrl();
  const cache = readCatalogCache();
  const fromStorage = loadFromStorage();
  let fromJson = [];
  try {
    fromJson = await fetchCatalogJson();
  } catch (_) {}

  const fastLayers = [];
  if (fromJson.length) fastLayers.push(fromJson);
  if (fromStorage.length) fastLayers.push(fromStorage);
  if (cache && cache.products.length) fastLayers.push(cache.products);
  const fastCatalog = mergeCatalogLayers(fastLayers);

  if (!googleUrl) {
    return fastCatalog;
  }

  if (cache && isCatalogCacheFresh(cache.ts)) {
    refreshCatalogFromGoogle(googleUrl);
    return mergeCatalogLayers([fromJson, fromStorage, cache.products]);
  }

  if (fastCatalog.length > BASE_PRODUCTS.length || (cache && cache.products.length)) {
    refreshCatalogFromGoogle(googleUrl);
    return fastCatalog;
  }

  try {
    const fromGoogle = await fetchFromGoogle(googleUrl, GOOGLE_FETCH_TIMEOUT_MS);
    if (fromGoogle.length) {
      writeCatalogCache(fromGoogle);
      try {
        saveToStorage(fromGoogle);
      } catch (_) {}
      return mergeCatalogLayers([fromJson, fromStorage, fromGoogle]);
    }
  } catch (err) {
    console.warn("Google catalog load failed:", err);
  }

  refreshCatalogFromGoogle(googleUrl);
  return fastCatalog;
}

function formatPrice(price) {
  const value = parsePrice(price);
  if (value === null) return "";
  return `${value.toFixed(2)} грн`;
}

function imageForGoogleExport(img) {
  const s = String(img || "").trim();
  if (!s || s.startsWith("data:")) return "";
  return s;
}

function productSnapshot(p) {
  const n = normalizeProduct(p);
  if (!n) return null;
  return {
    id: n.id,
    n: n.n,
    c: n.c,
    saleType: n.saleType,
    price: n.price
  };
}

function snapshotsMatch(local, remote) {
  if (!local || !remote) return false;
  if (local.n !== remote.n) return false;
  if (local.c !== remote.c) return false;
  if (local.saleType !== remote.saleType) return false;
  const lp = local.price;
  const rp = remote.price;
  if (lp === null && rp === null) return true;
  if (lp === null || rp === null) return false;
  return Math.abs(lp - rp) < 0.001;
}

function toProductsJson(products) {
  return products.map((p) => {
    const saleType = getPrimarySaleType(p);
    const unit = unitFromSaleType(saleType);
    const metrics = getUnitMetrics(unit);
    const row = {
      id: p.id,
      name: p.n,
      category: p.c,
      sale_type: saleType,
      unit,
      unit_min:
        p.unitMin !== null && p.unitMin !== undefined ? p.unitMin : metrics.min,
      unit_step:
        p.unitStep !== null && p.unitStep !== undefined ? p.unitStep : metrics.step
    };
    if (p.price !== null && p.price !== undefined) row.price = p.price;
    const img = imageForGoogleExport(p.img);
    if (img) row.image = img;
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
  getAdminCategoryOrder,
  getStoreCategoryOrder,
  setCategoryOrder,
  resetCategoryOrder,
  downloadCategoryOrderJson,
  ensureCategoryOrderReady,
  countProductsPerCategory,
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
  fetchSiteConfig,
  getGoogleWebAppUrl,
  setGoogleWebAppUrl,
  fetchFromGoogle,
  fetchTrending,
  fetchDashboard,
  trackCartAdd,
  dedupeProductsById,
  repairGoogleSheet,
  writeCatalogCache,
  getCatalogLoadMessages,
  markCatalogVisited,
  productSnapshot,
  loadCatalogForAdmin,
  applyGoogleCatalogLocally,
  verifyProductOnGoogle,
  saveToGoogle
};
