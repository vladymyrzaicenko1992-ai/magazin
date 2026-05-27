(function () {
  const CART_KEY = "magazin-cart-v1";

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (_) {}
    updateBadge();
  }

  function parsePrice(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(",", ".").trim());
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function getCount() {
    return loadCart().reduce((sum, x) => sum + (x.qty || 0), 0);
  }

  function addItem(product, qty) {
    const price = parsePrice(product.price);
    if (price === null) return { ok: false, error: "no_price" };

    const amount = Math.max(1, Math.floor(Number(qty) || 1));
    const cart = loadCart();
    const idx = cart.findIndex((x) => x.id === product.id);
    const row = {
      id: product.id,
      n: product.n,
      c: product.c,
      price,
      qty: amount
    };

    if (idx >= 0) {
      cart[idx].qty += amount;
      cart[idx].price = price;
      cart[idx].n = product.n;
    } else {
      cart.push(row);
    }
    saveCart(cart);
    return { ok: true };
  }

  function setQty(id, qty) {
    const cart = loadCart();
    const item = cart.find((x) => x.id === id);
    if (!item) return;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) {
      removeItem(id);
      return;
    }
    item.qty = n;
    saveCart(cart);
  }

  function changeQty(id, delta) {
    const cart = loadCart();
    const item = cart.find((x) => x.id === id);
    if (!item) return;
    setQty(id, (item.qty || 1) + delta);
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

  async function getOrderApiUrl() {
    try {
      const res = await fetch(`assets/data/config.json?v=${Date.now()}`);
      if (!res.ok) return "";
      const cfg = await res.json();
      return (cfg.orderApiUrl || cfg.googleWebAppUrl || "").trim();
    } catch (_) {
      return "";
    }
  }

  function buildOrderPayload(items, customer) {
    return {
      action: "order",
      name: customer.name,
      phone: customer.phone,
      comment: customer.comment || "",
      website: "",
      items: items.map((it) => ({
        id: it.id,
        name: it.n,
        qty: it.qty,
        price: it.price
      })),
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
      throw new Error("API замовлень не налаштовано");
    }

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
      throw new Error("Сервер не повернув JSON. Оновіть Apps Script (action=order).");
    }
    if (!data.ok) {
      throw new Error(data.error || "Не вдалося відправити замовлення");
    }
    return data;
  }

  function updateBadge() {
    const el = document.getElementById("cartBadge");
    if (!el) return;
    const n = getCount();
    el.textContent = String(n);
    el.hidden = n < 1;
  }

  window.MagazinCart = {
    CART_KEY,
    loadCart,
    saveCart,
    getCount,
    addItem,
    setQty,
    changeQty,
    removeItem,
    clearCart,
    lineTotal,
    cartTotal,
    formatMoney,
    submitOrder,
    updateBadge,
    parsePrice
  };

  updateBadge();
})();
