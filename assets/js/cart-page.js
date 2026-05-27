(function () {
  const Cart = window.MagazinCart;
  const Catalog = window.MagazinCatalog;
  if (!Cart || !Catalog) return;

  const listEl = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCountLabel");
  const checkoutEl = document.getElementById("cartCheckout");
  const footEl = document.getElementById("cartFoot");
  const emptyEl = document.getElementById("cartEmpty");
  const wrapEl = document.getElementById("cartContent");
  const form = document.getElementById("checkoutForm");
  const nameEl = document.getElementById("customerName");
  const phoneEl = document.getElementById("customerPhone");
  const addressEl = document.getElementById("customerAddress");
  const commentEl = document.getElementById("customerComment");
  const submitBtn = document.getElementById("cartSubmitBtn");
  const formErr = document.getElementById("checkoutError");
  const successEl = document.getElementById("cartSuccess");
  const clearBtn = document.getElementById("cartClearBtn");

  let items = [];
  let productsById = new Map();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unitOptionsHtml(selected) {
    return Cart.UNITS.map(
      (u) =>
        `<option value="${u.id}"${u.id === selected ? " selected" : ""}>${escapeHtml(u.label)} (${u.short})</option>`
    ).join("");
  }

  function syncFromCatalog() {
    items = Cart.loadCart().map((row) => {
      const fresh = productsById.get(row.id);
      if (!fresh) return Cart.normalizeItem(row);
      const price = Cart.parsePrice(fresh.price);
      return Cart.normalizeItem({
        ...row,
        n: fresh.n || row.n,
        c: fresh.c || row.c,
        price: price !== null ? price : row.price
      });
    });
    Cart.saveCart(items);
  }

  function fillCustomerForm() {
    const saved = Cart.loadCustomer();
    if (nameEl && saved.name) nameEl.value = saved.name;
    if (phoneEl && saved.phone) phoneEl.value = saved.phone;
    if (addressEl && saved.address) addressEl.value = saved.address;
  }

  function showSuccess() {
    if (wrapEl) wrapEl.hidden = true;
    if (checkoutEl) checkoutEl.hidden = true;
    if (footEl) footEl.hidden = true;
    if (successEl) successEl.hidden = false;
  }

  function render() {
    if (!items.length) {
      if (emptyEl) emptyEl.hidden = false;
      if (wrapEl) wrapEl.hidden = true;
      if (checkoutEl) checkoutEl.hidden = true;
      if (footEl) footEl.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (wrapEl) wrapEl.hidden = false;
    if (checkoutEl) checkoutEl.hidden = false;
    if (footEl) footEl.hidden = false;

    if (countEl) {
      const n = items.length;
      countEl.textContent = n === 1 ? "1 позиція" : `${n} позиції`;
    }

    listEl.innerHTML = "";
    items.forEach((item) => {
      const u = Cart.getUnit(item.unit);
      const line = Cart.lineTotal(item);
      const row = document.createElement("article");
      row.className = "cart-row";
      const catLine =
        window.MagazinStoreMeta && item.c
          ? window.MagazinStoreMeta.getDisplaySubtitle({ c: item.c })
          : item.c;
      row.innerHTML = `
        <div class="cart-row-top">
          <div class="cart-row-main">
            <div class="cart-row-name">${escapeHtml(item.n)}</div>
            <div class="cart-row-cat">${escapeHtml(catLine)}</div>
            <div class="cart-row-price">${Cart.formatMoney(item.price)} <span>/ ${escapeHtml(u.short)}</span></div>
          </div>
          <button type="button" class="cart-remove" data-id="${escapeHtml(item.id)}" aria-label="Видалити">×</button>
        </div>
        <div class="cart-row-controls">
          <label class="field-label">
            <span>Одиниця</span>
            <select class="unit-select" data-id="${escapeHtml(item.id)}">${unitOptionsHtml(item.unit)}</select>
          </label>
          <label class="field-label field-qty">
            <span>Кількість</span>
            <div class="qty-stepper">
              <button type="button" class="qty-btn" data-action="minus" data-id="${escapeHtml(item.id)}" aria-label="Менше">−</button>
              <input type="number" class="qty-input" data-id="${escapeHtml(item.id)}" value="${escapeHtml(Cart.formatQty(item.qty, item.unit))}" min="${u.min}" step="${u.step}" inputmode="decimal">
              <button type="button" class="qty-btn" data-action="plus" data-id="${escapeHtml(item.id)}" aria-label="Більше">+</button>
            </div>
          </label>
          <div class="cart-line-sum-wrap">
            <span class="sum-label">Сума</span>
            <span class="cart-line-sum">${Cart.formatMoney(line)}</span>
          </div>
        </div>
      `;

      row.querySelector(".unit-select").addEventListener("change", (e) => {
        Cart.setUnit(item.id, e.target.value);
        items = Cart.loadCart();
        render();
      });

      row.querySelector('[data-action="minus"]').addEventListener("click", () => {
        Cart.changeQty(item.id, -1);
        items = Cart.loadCart();
        render();
      });
      row.querySelector('[data-action="plus"]').addEventListener("click", () => {
        Cart.changeQty(item.id, 1);
        items = Cart.loadCart();
        render();
      });

      const qtyInput = row.querySelector(".qty-input");
      qtyInput.addEventListener("change", () => {
        Cart.setQty(item.id, qtyInput.value);
        items = Cart.loadCart();
        render();
      });

      row.querySelector(".cart-remove").addEventListener("click", () => {
        Cart.removeItem(item.id);
        items = Cart.loadCart();
        render();
      });

      listEl.appendChild(row);
    });

    if (totalEl) totalEl.textContent = Cart.formatMoney(Cart.cartTotal(items));
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!items.length || !confirm("Очистити кошик?")) return;
      Cart.clearCart();
      items = [];
      render();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!items.length) return;

      const customer = {
        name: nameEl ? nameEl.value.trim() : "",
        phone: phoneEl ? phoneEl.value.trim() : "",
        address: addressEl ? addressEl.value.trim() : "",
        comment: commentEl ? commentEl.value.trim() : ""
      };

      if (formErr) formErr.textContent = "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Відправляємо…";
      }

      try {
        await Cart.submitOrder(items, customer);
        Cart.clearCart();
        items = [];
        showSuccess();
      } catch (err) {
        if (formErr) formErr.textContent = err.message || "Помилка відправки";
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Оформити замовлення";
        }
      }
    });
  }

  async function init() {
    try {
      const catalog = await Catalog.loadCatalog();
      productsById = new Map(catalog.map((p) => [p.id, p]));
      items = Cart.loadCart();
      syncFromCatalog();
      fillCustomerForm();
      render();
    } catch (err) {
      console.error(err);
      if (listEl) listEl.innerHTML = '<p class="cart-err">Не вдалося завантажити каталог.</p>';
    }
  }

  init();
})();
