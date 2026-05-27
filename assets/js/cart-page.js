(function () {
  const Cart = window.MagazinCart;
  const Catalog = window.MagazinCatalog;
  if (!Cart || !Catalog) return;

  const listEl = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const orderBtn = document.getElementById("cartOrderBtn");
  const emptyEl = document.getElementById("cartEmpty");
  const wrapEl = document.getElementById("cartContent");

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

  function render() {
    if (!items.length) {
      if (emptyEl) emptyEl.hidden = false;
      if (wrapEl) wrapEl.hidden = true;
      if (orderBtn) orderBtn.disabled = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (wrapEl) wrapEl.hidden = false;
    if (orderBtn) orderBtn.disabled = false;

    listEl.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const line = Cart.lineTotal(item);
      row.innerHTML = `
        <div class="cart-row-main">
          <div class="cart-row-name">${escapeHtml(item.n)}</div>
          <div class="cart-row-meta">${escapeHtml(item.c)} · ${Cart.formatMoney(item.price)} / шт</div>
        </div>
        <div class="cart-row-qty">
          <label class="sr-only" for="qty-${escapeHtml(item.id)}">Кількість</label>
          <input type="number" min="1" step="1" id="qty-${escapeHtml(item.id)}" value="${item.qty}" data-id="${escapeHtml(item.id)}">
          <span class="cart-line-sum">${Cart.formatMoney(line)}</span>
        </div>
        <button type="button" class="cart-remove" data-id="${escapeHtml(item.id)}" aria-label="Видалити">×</button>
      `;

      const qtyInput = row.querySelector("input");
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

  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      if (!items.length) return;
      const priced = items.filter((x) => Cart.parsePrice(x.price) !== null);
      if (!priced.length) {
        alert("У кошику немає товарів з ціною. Приберіть позиції без ціни або уточніть у продавця.");
        return;
      }
      Cart.openTelegramOrder(priced);
    });
  }

  const clearBtn = document.getElementById("cartClearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!items.length || !confirm("Очистити кошик?")) return;
      Cart.clearCart();
      items = [];
      render();
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
