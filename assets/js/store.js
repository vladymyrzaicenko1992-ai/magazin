(function () {
  const Catalog = window.MagazinCatalog;
  const Meta = window.MagazinStoreMeta;
  if (!Catalog || !Meta) {
    console.error("MagazinCatalog або MagazinStoreMeta не завантажено");
    return;
  }

  const Cart = window.MagazinCart;
  const { loadCatalog } = Catalog;
  const CAT_ORDER = ["Усі", "Вареники", "Млинці", "Додатково", "Котлети", "Пельмені", "Хінкалі", "Молочка"];

  const catsEl = document.getElementById("cats");
  const grid = document.getElementById("pgrid");
  const trendingGrid = document.getElementById("trendingGrid");
  const trendingWrap = document.getElementById("trendingWrap");
  const search = document.getElementById("searchInput");
  const lbl = document.getElementById("secLbl");
  const socialToast = document.getElementById("socialToast");
  const upsellPop = document.getElementById("upsellPop");
  const addToast = document.getElementById("addToast");

  if (!catsEl || !grid) {
    console.error("Не знайдено контейнери каталогу");
    return;
  }

  let products = [];
  let categoryMins = {};
  let activeCat = "Усі";
  let q = "";
  let socialTimer = null;

  async function loadProducts() {
    products = await loadCatalog();
    categoryMins = Meta.buildCategoryMins(products);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTrendingId(id) {
    return Meta.TRENDING_IDS.includes(id);
  }

  function filterList(list) {
    const lq = q.toLowerCase().trim();
    let filtered = list.filter(
      (p) =>
        Meta.isListed(p, categoryMins) &&
        (activeCat === "Усі" || p.c === activeCat) &&
        (!lq || p.n.toLowerCase().includes(lq) || p.c.toLowerCase().includes(lq))
    );
    if (activeCat === "Усі" && !lq) {
      filtered = filtered.filter((p) => !isTrendingId(p.id));
    }
    return filtered;
  }

  function renderCategories() {
    const presentCats = new Set(products.filter((p) => Meta.isListed(p, categoryMins)).map((x) => x.c));
    const cats = CAT_ORDER.filter((c) => c === "Усі" || presentCats.has(c));
    catsEl.innerHTML = "";

    cats.forEach((cat) => {
      const meta = Meta.getCatMeta(cat);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cat-btn" + (cat === activeCat ? " active" : "");
      b.textContent = meta.emoji + " " + meta.label;
      b.addEventListener("click", () => {
        activeCat = cat;
        document.querySelectorAll(".cat-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        if (lbl) {
          lbl.textContent = cat === "Усі" ? "✨ Усі товари" : meta.emoji + " " + meta.label;
        }
        render();
        const catalog = document.getElementById("catalog");
        if (catalog) catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      catsEl.appendChild(b);
    });
  }

  function buildCardHtml(p, opts) {
    opts = opts || {};
    const img = p.img ? encodeURI(p.img) : "";
    const priceInfo = Meta.getPriceDisplay(p, categoryMins);
    if (!priceInfo) return "";

    const canOrder = priceInfo.canOrder && Cart;
    const inCart = canOrder && Cart.isInCart(p.id);
    const badges = Meta.getBadges(p);
    const badgeHtml = badges
      .map((b) => '<span class="pcard-badge ' + b.cls + '">' + escapeHtml(b.text) + "</span>")
      .join("");

    const title = Meta.getDisplayTitle(p);
    const subtitle = Meta.getDisplaySubtitle(p);
    const layoutClass = opts.featured ? " pcard--featured" : " pcard--catalog";
    const topClass = opts.featuredTop ? " pcard--top" : "";

    return (
      '<article class="pcard pcard--glass' +
      layoutClass +
      topClass +
      '" data-id="' +
      escapeHtml(p.id) +
      '">' +
      '<div class="pcard-img">' +
      (img
        ? '<img src="' + img + '" alt="" loading="lazy">'
        : '<span class="pcard-ph" aria-hidden="true">🍽️</span>') +
      '<div class="pcard-badges">' +
      badgeHtml +
      "</div>" +
      '<div class="pcard-img-overlay">' +
      '<div class="pcard-name">' +
      escapeHtml(title) +
      "</div>" +
      '<div class="pcard-sub">' +
      escapeHtml(subtitle) +
      "</div>" +
      "</div>" +
      '<div class="pcard-img-foot">' +
      '<div class="pcard-price">' +
      escapeHtml(priceInfo.text) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="pcard-body">' +
      (canOrder
        ? '<button type="button" class="pcard-add' +
          (inCart ? " in-cart" : "") +
          '" data-id="' +
          escapeHtml(p.id) +
          '">' +
          (inCart ? "✓ У кошику" : "➕ Додати") +
          "</button>"
        : '<span class="pcard-add pcard-add--muted" aria-disabled="true">Актуальна ціна у продавця</span>') +
      "</div>" +
      "</article>"
    );
  }

  function flashAddToast(name) {
    if (!addToast) return;
    addToast.textContent = "✓ Додано: " + name;
    addToast.hidden = false;
    addToast.classList.add("is-visible");
    clearTimeout(addToast._t);
    addToast._t = setTimeout(() => {
      addToast.classList.remove("is-visible");
      setTimeout(() => {
        addToast.hidden = true;
      }, 300);
    }, 2200);
  }

  function bindCardActions(root) {
    root.querySelectorAll(".pcard-add:not(.pcard-add--muted)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const p = products.find((x) => x.id === id);
        if (!p || !Cart) return;
        const result = Cart.addItem(p, 1);
        if (!result.ok) return;
        btn.classList.add("pcard-add--pop");
        setTimeout(() => btn.classList.remove("pcard-add--pop"), 400);
        flashAddToast(p.n);
        showUpsell(p);
        render();
        renderTrending();
      });
    });
  }

  function renderTrending() {
    if (!trendingGrid || !trendingWrap) return;
    const trending = Meta.TRENDING_IDS.map((id) => products.find((p) => p.id === id)).filter(
      (p) => p && Meta.isListed(p, categoryMins)
    );
    if (!trending.length) {
      trendingWrap.hidden = true;
      return;
    }
    trendingWrap.hidden = false;
    trendingGrid.innerHTML = trending
      .map((p, i) => buildCardHtml(p, { featured: true, featuredTop: i === 0 }))
      .join("");
    bindCardActions(trendingGrid);
  }

  function render() {
    const list = filterList(products);

    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="no-res">🔍 Нічого не знайдено</div>';
      return;
    }

    grid.innerHTML = list.map((p) => buildCardHtml(p)).join("");
    bindCardActions(grid);
  }

  function showUpsell(addedProduct) {
    if (!upsellPop) return;
    const suggestions = Meta.getUpsellIds(addedProduct, products);
    if (!suggestions.length) {
      upsellPop.hidden = true;
      return;
    }

    const label = Meta.getUpsellLabel(addedProduct);
    const quickBtns = suggestions
      .map((s) => {
        const pr = Meta.getPriceDisplay(s, categoryMins);
        const short =
          s.id === "smetana"
            ? "сметану"
            : s.id === "maslo-vershk"
              ? "масло"
              : s.id === "tvorog"
                ? "сир"
                : s.n;
        return (
          '<button type="button" class="upsell-quick" data-upsell-id="' +
          escapeHtml(s.id) +
          '">➕ Додати ' +
          escapeHtml(short) +
          (pr ? " · " + escapeHtml(pr.text) : "") +
          "</button>"
        );
      })
      .join("");

    upsellPop.innerHTML =
      '<div class="upsell-in">' +
      '<button type="button" class="upsell-close" aria-label="Закрити">×</button>' +
      '<p class="upsell-title">🥛 До ' +
      escapeHtml(label) +
      " часто беруть</p>" +
      '<div class="upsell-quick-row">' +
      quickBtns +
      "</div>" +
      '<ul class="upsell-list">' +
      suggestions
        .map((s) => {
          const pr = Meta.getPriceDisplay(s, categoryMins);
          return (
            '<li><button type="button" class="upsell-item" data-upsell-id="' +
            escapeHtml(s.id) +
            '"><span>' +
            escapeHtml(s.n) +
            "</span><strong>" +
            escapeHtml(pr ? pr.text : "") +
            "</strong></button></li>"
          );
        })
        .join("") +
      "</ul></div>";

    upsellPop.hidden = false;
    upsellPop.querySelector(".upsell-close").addEventListener("click", () => {
      upsellPop.hidden = true;
    });
    upsellPop.querySelectorAll("[data-upsell-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-upsell-id");
        const p = products.find((x) => x.id === id);
        if (p && Cart) {
          Cart.addItem(p, 1);
          flashAddToast(p.n);
          upsellPop.hidden = true;
          render();
          renderTrending();
        }
      });
    });

    clearTimeout(upsellPop._hide);
    upsellPop._hide = setTimeout(() => {
      upsellPop.hidden = true;
    }, 14000);
  }

  function startSocialProof() {
    if (!socialToast) return;
    const pool = products.filter((p) => Meta.isListed(p, categoryMins) && Meta.parsePrice(p) !== null);
    if (pool.length < 2) return;

    function tick() {
      const p = pool[Math.floor(Math.random() * pool.length)];
      socialToast.hidden = false;
      socialToast.innerHTML =
        '<span class="social-ico">🔥</span><span><strong>Щойно обрали:</strong> ' +
        escapeHtml(p.n) +
        "</span>";
      socialToast.classList.add("is-visible");
      clearTimeout(socialToast._hide);
      socialToast._hide = setTimeout(() => {
        socialToast.classList.remove("is-visible");
      }, 4500);
      socialTimer = setTimeout(tick, 8000 + Math.random() * 4000);
    }

    socialTimer = setTimeout(tick, 5000);
  }

  async function init() {
    try {
      await loadProducts();
      renderCategories();
      renderTrending();
      render();
      startSocialProof();
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<div class="no-res">Не вдалося завантажити каталог. Оновіть сторінку.</div>';
    }
  }

  if (search) {
    search.addEventListener("input", (e) => {
      q = e.target.value;
      render();
    });
  }

  const heroCta = document.querySelector(".hero-cta");
  if (heroCta) {
    heroCta.addEventListener("click", (e) => {
      const target = document.getElementById("trendingWrap");
      if (target && !target.hidden) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  window.addEventListener("magazin-cart-changed", () => {
    if (products.length) {
      renderTrending();
      render();
    }
  });

  window.addEventListener("pageshow", () => {
    if (products.length) {
      renderTrending();
      render();
    }
  });

  init();
})();
