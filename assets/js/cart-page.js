(function () {
  const Cart = window.MagazinCart;
  const Catalog = window.MagazinCatalog;
  if (!Cart || !Catalog) return;

  const listEl = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const checkoutEl = document.getElementById("cartCheckout");
  const footEl = document.getElementById("cartFoot");
  const emptyEl = document.getElementById("cartEmpty");
  const wrapEl = document.getElementById("cartContent");
  const form = document.getElementById("checkoutForm");
  const nameEl = document.getElementById("customerName");
  const phoneEl = document.getElementById("customerPhone");
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

  function syncFromCatalog() {
    items = Cart.loadCart().map((row) => {
      const fresh = productsById.get(row.id);
      if (!fresh) return row;
      const price = Cart.parsePrice(fresh.price);
      return {
        ...row,
        n: fresh.n || row.n,
        c: fresh.c || row.c,
        price: price !== null ? price : row.price
      };
    });
    Cart.saveCart(items);
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

    listEl.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const line = Cart.lineTotal(item);
      row.innerHTML = `
        <div class="cart-row-main">
          <div class="cart-row-name">${escapeHtml(item.n)}</div>
          <div class="cart-row-meta">${Cart.formatMoney(item.price)} / шт</div>
        </div>
        <div class="qty-stepper">
          <button type="button" class="qty-btn" data-action="minus" data-id="${escapeHtml(item.id)}" aria-label="Менше">−</button>
          <span class="qty-val">${item.qty}</span>
          <button type="button" class="qty-btn" data-action="plus" data-id="${escapeHtml(item.id)}" aria-label="Більше">+</button>
        </div>
        <div class="cart-row-end">
          <span class="cart-line-sum">${Cart.formatMoney(line)}</span>
          <button type="button" class="cart-remove" data-id="${escapeHtml(item.id)}" aria-label="Видалити">×</button>
        </div>
      `;

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
      render();
    } catch (err) {
      console.error(err);
      if (listEl) listEl.innerHTML = '<p class="cart-err">Не вдалося завантажити каталог.</p>';
    }
  }

  init();
})();
