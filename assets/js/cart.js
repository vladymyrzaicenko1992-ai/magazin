(function () {
  const CART_KEY = "magazin-cart-v1";
  const TELEGRAM_PHONE = "380955301343";

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

  function buildOrderMessage(items) {
    const lines = ["🛒 Замовлення з vse-v-morozilke.shop", ""];
    items.forEach((item, i) => {
      const sum = lineTotal(item);
      lines.push(
        `${i + 1}. ${item.n} — ${item.qty} шт × ${formatMoney(item.price)} = ${formatMoney(sum)}`
      );
    });
    lines.push("", `💰 Разом: ${formatMoney(cartTotal(items))}`);
    lines.push("", "Дякуємо! Очікуємо підтвердження.");
    return lines.join("\n");
  }

  function openTelegramOrder(items) {
    const text = buildOrderMessage(items);
    const encoded = encodeURIComponent(text);
    const web = `https://t.me/+${TELEGRAM_PHONE}?text=${encoded}`;
    window.location.href = web;
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
    TELEGRAM_PHONE,
    loadCart,
    saveCart,
    getCount,
    addItem,
    setQty,
    removeItem,
    clearCart,
    lineTotal,
    cartTotal,
    formatMoney,
    buildOrderMessage,
    openTelegramOrder,
    updateBadge,
    parsePrice
  };

  updateBadge();
})();
