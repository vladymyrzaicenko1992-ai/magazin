(function () {
  const CART_KEY = "magazin-cart-v2";
  const CART_KEY_LEGACY = "magazin-cart-v1";
  const CUSTOMER_KEY = "magazin-customer-v1";

  const UNITS = [
    { id: "pcs", label: "Штуки", short: "шт", step: 1, min: 1, dec: 0 },
    { id: "kg", label: "Кілограми", short: "кг", step: 0.1, min: 0.1, dec: 1 },
    { id: "g", label: "Грами", short: "г", step: 100, min: 50, dec: 0 },
    { id: "l", label: "Літри", short: "л", step: 0.1, min: 0.1, dec: 1 },
    { id: "ml", label: "Мілілітри", short: "мл", step: 100, min: 100, dec: 0 },
    { id: "pack", label: "Упаковки", short: "уп", step: 1, min: 1, dec: 0 }
  ];
  const SALE_TYPE_TO_UNIT = { kg: "kg", pcs: "pcs", pack: "pack" };

  function normalizeSaleTypes(value, fallbackUnit) {
    const raw = Array.isArray(value)
      ? value
      : String(value || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    const out = raw
      .map((x) => String(x).toLowerCase())
      .filter((x) => SALE_TYPE_TO_UNIT[x]);
    if (out.length) return Array.from(new Set(out));
    if (fallbackUnit === "kg") return ["kg"];
    if (fallbackUnit === "pack") return ["pack"];
    return ["pcs"];
  }

  function unitFromSaleType(type) {
    return SALE_TYPE_TO_UNIT[type] || "pcs";
  }

  function allowedUnitsFromSaleTypes(saleTypes) {
    return normalizeSaleTypes(saleTypes).map(unitFromSaleType);
  }

  function getUnit(unitId) {
    return UNITS.find((u) => u.id === unitId) || UNITS[0];
  }

  function getUnitForItem(item) {
    const base = { ...getUnit(item && item.unit) };
    const min = item && item.unitMin;
    const step = item && item.unitStep;
    if (min != null && Number.isFinite(Number(min))) base.min = Number(min);
    if (step != null && Number.isFinite(Number(step))) base.step = Number(step);
    return base;
  }

  function resolveProductUnit(product) {
    const Catalog = window.MagazinCatalog;
    if (Catalog && Catalog.getPrimarySaleType) {
      return Catalog.unitFromSaleType(Catalog.getPrimarySaleType(product));
    }
    const saleTypes = normalizeSaleTypes(product.saleTypes || product.sale_type, product.unit);
    return unitFromSaleType(saleTypes[0]);
  }

  function loadCart() {
    try {
      let raw = localStorage.getItem(CART_KEY);
      if (!raw) {
        raw = localStorage.getItem(CART_KEY_LEGACY);
        if (raw) {
          localStorage.setItem(CART_KEY, raw);
          localStorage.removeItem(CART_KEY_LEGACY);
        }
      }
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.map(normalizeItem).filter((x) => x.id) : [];
    } catch (_) {
      return [];
    }
  }

  function normalizeItem(item) {
    if (!item || !item.id) return null;
    const saleTypes = normalizeSaleTypes(
      item.saleTypes || item.saleType || item.sale_type,
      item.unit
    );
    const saleType = item.saleType || saleTypes[0] || "pcs";
    const unit = item.unit || unitFromSaleType(saleType);
    const draft = {
      id: item.id,
      n: item.n || "",
      c: item.c || "",
      price: parsePrice(item.price),
      qty: item.qty,
      unit,
      saleType,
      saleTypes: [saleType],
      unitMin: item.unitMin,
      unitStep: item.unitStep
    };
    const u = getUnitForItem(draft);
    let qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty <= 0) qty = u.min;
    if (u.dec === 0) qty = Math.max(u.min, Math.round(qty));
    else qty = Math.max(u.min, Math.round(qty * 10) / 10);
    draft.qty = qty;
    draft.unit = u.id;
    return draft;
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items.map(normalizeItem).filter(Boolean)));
    } catch (_) {}
    updateBadge();
    try {
      window.dispatchEvent(new Event("magazin-cart-changed"));
    } catch (_) {}
  }

  function isInCart(id) {
    return loadCart().some((x) => x.id === id);
  }

  function parsePrice(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(",", ".").trim());
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function formatQty(qty, unitId) {
    const u = getUnit(unitId);
    if (u.dec === 0) return String(Math.round(qty));
    const s = Number(qty).toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  }

  function getCount() {
    return loadCart().reduce((sum, x) => sum + (x.qty || 0), 0);
  }

  function getPositionsCount() {
    return loadCart().length;
  }

  function addItem(product, qty) {
    const price = parsePrice(product.price);
    if (price === null) return { ok: false, error: "no_price" };

    const cart = loadCart();
    const idx = cart.findIndex((x) => x.id === product.id);
    const addQty = Math.max(1, Number(qty) || 1);

    const Catalog = window.MagazinCatalog;
    const saleType =
      Catalog && Catalog.getPrimarySaleType
        ? Catalog.getPrimarySaleType(product)
        : normalizeSaleTypes(product.saleTypes || product.sale_type, product.unit)[0];
    const unit = resolveProductUnit(product);
    const metrics =
      Catalog && Catalog.getUnitMetrics
        ? Catalog.getUnitMetrics(unit)
        : { min: getUnit(unit).min, step: getUnit(unit).step };

    if (idx >= 0) {
      cart[idx].qty += addQty;
      cart[idx].price = price;
      cart[idx].n = product.n;
      cart[idx].unit = unit;
      cart[idx].saleType = saleType;
      cart[idx].saleTypes = [saleType];
      cart[idx].unitMin = product.unitMin != null ? product.unitMin : metrics.min;
      cart[idx].unitStep = product.unitStep != null ? product.unitStep : metrics.step;
    } else {
      cart.push(
        normalizeItem({
          id: product.id,
          n: product.n,
          c: product.c,
          price,
          qty: addQty,
          unit,
          saleType,
          saleTypes: [saleType],
          unitMin: product.unitMin != null ? product.unitMin : metrics.min,
          unitStep: product.unitStep != null ? product.unitStep : metrics.step
        })
      );
    }
    saveCart(cart);
    try {
      const Catalog = window.MagazinCatalog;
      if (Catalog && Catalog.trackCartAdd) {
        Catalog.getGoogleWebAppUrl().then((url) => {
          if (url) Catalog.trackCartAdd(url, product, addQty);
        });
      }
    } catch (_) {}
    return { ok: true };
  }

  function setQty(id, qty) {
    const cart = loadCart();
    const item = cart.find((x) => x.id === id);
    if (!item) return;
    const u = getUnitForItem(item);
    let n = Number(String(qty).replace(",", "."));
    if (!Number.isFinite(n) || n < u.min) {
      removeItem(id);
      return;
    }
    if (u.dec === 0) n = Math.round(n);
    else n = Math.round(n * 10) / 10;
    item.qty = Math.max(u.min, n);
    saveCart(cart);
  }

  function changeQty(id, delta) {
    const cart = loadCart();
    const item = cart.find((x) => x.id === id);
    if (!item) return;
    const u = getUnitForItem(item);
    setQty(id, (item.qty || u.min) + delta * u.step);
  }

  function removeItem(id) {
    saveCart(loadCart().filter((x) => x.id !== id));
  }

  function clearCart() {
    saveCart([]);
  }

  function lineTotal(item) {
    return (item.price || 0) * (item.qty || 0);
  }

  function cartTotal(items) {
    return items.reduce((sum, x) => sum + lineTotal(x), 0);
  }

  function formatMoney(n) {
    return `${Number(n).toFixed(2)} грн`;
  }

  function lineLabel(item) {
    const u = getUnitForItem(item);
    return `${formatQty(item.qty, item.unit)} ${u.short}`;
  }

  function unitLabelForItem(item) {
    const Catalog = window.MagazinCatalog;
    if (Catalog && Catalog.SALE_TYPES && item.saleType) {
      const st = Catalog.SALE_TYPES.find((s) => s.id === item.saleType);
      if (st) return st.label;
    }
    return getUnitForItem(item).short;
  }

  function loadCustomer() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveCustomer(data) {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  async function getOrderApiUrl() {
    try {
      const res = await fetch(`assets/data/config.json?v=${Date.now()}`);
      if (!res.ok) return "";
      const cfg = await res.json();
      return (cfg.googleWebAppUrl || "").trim();
    } catch (_) {
      return "";
    }
  }

  function buildOrderPayload(items, customer) {
    return {
      action: "order",
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
      comment: customer.comment || "",
      website: "",
      items: items.map((it) => {
        const u = getUnitForItem(it);
        const saleType = it.saleType || normalizeSaleTypes(it.saleTypes, it.unit)[0] || "pcs";
        return {
          id: it.id,
          name: it.n,
          qty: it.qty,
          unit: u.id,
          unitLabel: u.short,
          saleType,
          unitMin: it.unitMin,
          unitStep: it.unitStep,
          estimated: saleType === "kg" || it.unit === "kg",
          price: it.price,
          lineTotal: lineTotal(it)
        };
      }),
      total: cartTotal(items)
    };
  }

  async function submitOrder(items, customer) {
    const priced = items.filter((x) => parsePrice(x.price) !== null);
    if (!priced.length) {
      throw new Error("У кошику немає товарів з ціною");
    }

    const apiUrl = await getOrderApiUrl();
    if (!apiUrl) {
      throw new Error("Не налаштовано googleWebAppUrl у assets/data/config.json");
    }

    saveCustomer({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || ""
    });

    const payload = buildOrderPayload(priced, customer);
    const res = await fetch(apiUrl, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(
        "Google Apps Script не відповів JSON. Розгорніть нову версію веб-додатку."
      );
    }
    if (!data.ok) {
      const err = data.error || "Не вдалося відправити замовлення";
      if (String(err).indexOf("Unknown action") >= 0) {
        throw new Error("Оновіть scripts/google-apps-script.gs і зробіть Нове розгортання.");
      }
      throw new Error(err);
    }
    return data;
  }

  function updateBadge() {
    const el = document.getElementById("cartBadge");
    if (!el) return;
    const n = getPositionsCount();
    el.textContent = String(n);
    el.hidden = n < 1;
  }

  window.MagazinCart = {
    CART_KEY,
    UNITS,
    getUnit,
    getUnitForItem,
    unitLabelForItem,
    loadCart,
    saveCart,
    isInCart,
    getCount,
    getPositionsCount,
    addItem,
    setQty,
    changeQty,
    removeItem,
    clearCart,
    lineTotal,
    cartTotal,
    formatMoney,
    formatQty,
    lineLabel,
    loadCustomer,
    saveCustomer,
    submitOrder,
    updateBadge,
    parsePrice,
    normalizeItem,
    normalizeSaleTypes
  };

  updateBadge();
})();
