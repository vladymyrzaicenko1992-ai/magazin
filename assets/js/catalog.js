const STORAGE_KEY = "magazin-products-v1";

function parsePrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeProduct(item) {
  return {
    id: item.id,
    n: item.n || item.name || "",
    c: item.c || item.category || "",
    img: item.img || item.image || "",
    price: parsePrice(item.price)
  };
}

function mergeById(base, overrides) {
  const map = new Map(base.map((p) => [p.id, { ...p }]));
  for (const item of overrides.map(normalizeProduct)) {
    const prev = map.get(item.id) || normalizeProduct({ id: item.id });
    map.set(item.id, {
      ...prev,
      ...item,
      price: item.price !== null ? item.price : prev.price
    });
  }
  return Array.from(map.values());
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw).map(normalizeProduct);
  } catch (_) {
    return [];
  }
}

function saveToStorage(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function fetchCatalogJson(url) {
  const res = await fetch(`${url}?v=${Date.now()}`);
  if (!res.ok) return [];
  return (await res.json()).map(normalizeProduct);
}

async function loadCatalog(fallbackProducts, jsonUrl) {
  let catalog = fallbackProducts.map(normalizeProduct);
  try {
    const fromJson = await fetchCatalogJson(jsonUrl || "assets/data/products.json");
    if (fromJson.length) catalog = mergeById(catalog, fromJson);
  } catch (_) {}

  const fromStorage = loadFromStorage();
  if (fromStorage.length) catalog = mergeById(catalog, fromStorage);
  return catalog;
}

function formatPrice(price) {
  const value = parsePrice(price);
  if (value === null) return "Ціну уточнюйте";
  return `${value.toFixed(2)} грн`;
}

function toProductsJson(products) {
  return products.map((p) => {
    const row = {
      id: p.id,
      name: p.n,
      category: p.c
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

window.MagazinCatalog = {
  STORAGE_KEY,
  parsePrice,
  normalizeProduct,
  mergeById,
  loadFromStorage,
  saveToStorage,
  fetchCatalogJson,
  loadCatalog,
  formatPrice,
  toProductsJson,
  downloadProductsJson
};
