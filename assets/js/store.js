(function () {
  const Catalog = window.MagazinCatalog;
  const Meta = window.MagazinStoreMeta;
  if (!Catalog || !Meta) {
    console.error("MagazinCatalog або MagazinStoreMeta не завантажено");
    return;
  }

  const Cart = window.MagazinCart;
  const { loadCatalog } = Catalog;
  const CAT_ORDER = [
    "Усі",
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

  const catsEl = document.getElementById("cats");
  const grid = document.getElementById("pgrid");
  const catalogLoader = document.getElementById("catalogLoader");
  const catalogSticky = document.getElementById("catalogSticky");
  const trendingGrid = document.getElementById("trendingGrid");
  const trendingWrap = document.getElementById("trendingWrap");
  const search = document.getElementById("searchInput");
  const lbl = document.getElementById("secLbl");
  const socialToast = document.getElementById("socialToast");
  const upsellPop = document.getElementById("upsellPop");
  const addToast = document.getElementById("addToast");
  const qtyModal = document.getElementById("qtyModal");
  const qtyModalTitle = document.getElementById("qtyModalTitle");
  const qtyModalHint = document.getElementById("qtyModalHint");
  const qtyModalInput = document.getElementById("qtyModalInput");
  const qtyModalMinus = document.getElementById("qtyModalMinus");
  const qtyModalPlus = document.getElementById("qtyModalPlus");
  const qtyModalConfirm = document.getElementById("qtyModalConfirm");
  let qtyModalProduct = null;
  let qtyModalUnit = null;
  const heroHot = document.getElementById("heroHot");
  const heroHotItems = document.getElementById("heroHotItems");
  const heroSocialLine = document.getElementById("heroSocialLine");
  const bundleWrap = document.getElementById("bundleWrap");
  const bundleCard = document.getElementById("bundleCard");

  if (!catsEl || !grid) {
    console.error("Не знайдено контейнери каталогу");
    return;
  }

  let products = [];
  let categoryMins = {};
  let trendingIds = Meta.TRENDING_IDS.slice();
  let activeCat = "Усі";
  let q = "";
  let socialTimer = null;

  function setCatalogLoading(on) {
    if (catalogLoader) {
      catalogLoader.hidden = !on;
      catalogLoader.setAttribute("aria-busy", on ? "true" : "false");
    }
    if (grid) grid.hidden = on;
    if (catalogSticky) catalogSticky.classList.toggle("is-catalog-loading", on);
    if (search) search.disabled = on;
  }

  async function loadProducts() {
    products = await loadCatalog();
    categoryMins = Meta.buildCategoryMins(products);
  }

  async function loadTrendingIds() {
    const url = await Catalog.getGoogleWebAppUrl();
    if (!url) return;
    try {
      const rows = await Catalog.fetchTrending(url, 4, 7);
      const ids = rows.map((r) => r.id).filter(Boolean);
      if (ids.length) trendingIds = ids;
    } catch (err) {
      console.warn("Топ з Google недоступний, резервний список:", err);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTrendingId(id) {
    return trendingIds.includes(id);
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
    const badges = Meta.getBadges(p, { isTrending: opts.isTrending });
    const badgeHtml = badges
      .map((b) => '<span class="pcard-badge ' + b.cls + '">' + escapeHtml(b.text) + "</span>")
      .join("");

    const title = Meta.getDisplayTitle(p);
    const subtitle = Meta.getDisplaySubtitle(p);
    const layoutClass = opts.featured ? " pcard--featured" : " pcard--catalog";
    const topClass = opts.featuredTop ? " pcard--top" : "";
    const compact = opts.compact !== false && !opts.featured;
    const subBlock = compact
      ? ""
      : '<div class="pcard-sub">' + escapeHtml(subtitle) + "</div>";

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
      subBlock +
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
          (inCart ? "✓ У кошику — змінити" : "Додати в кошик") +
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

  function refreshAfterCartChange() {
    renderTrending();
    renderTodayPicks();
    updateLiveStrip();
    render();
  }

  function getUnitForProduct(p) {
    const inCart = Cart.loadCart().find((x) => x.id === p.id);
    if (inCart) return Cart.getUnitForItem(inCart);
    return Cart.getUnitForItem({
      unit: p.unit,
      unitMin: p.unitMin,
      unitStep: p.unitStep
    });
  }

  function closeQtyModal() {
    if (qtyModal) qtyModal.hidden = true;
    qtyModalProduct = null;
  }

  function showQtyModal(p) {
    if (!qtyModal || !Cart || !p) return;
    const u = getUnitForProduct(p);
    qtyModalUnit = u;
    if (!Cart.isInCart(p.id)) {
      const r = Cart.addItem(p, u.min);
      if (!r.ok) return;
    }
    const item = Cart.loadCart().find((x) => x.id === p.id);
    let qty = item ? item.qty : u.min;
    qtyModalProduct = p;
    if (qtyModalTitle) qtyModalTitle.textContent = p.n;
    if (qtyModalHint) {
      const isKg = p.saleType === "kg" || p.unit === "kg";
      qtyModalHint.textContent = isKg
        ? "⚖️ Орієнтовна ціна — фінальна після зважування"
        : "Одиниця: " + u.short;
    }
    if (qtyModalInput) {
      qtyModalInput.min = String(u.min);
      qtyModalInput.step = String(u.step);
      qtyModalInput.value = Cart.formatQty(qty, u.id);
    }
    qtyModal.hidden = false;
  }

  function applyQtyModalValue() {
    if (!qtyModalProduct || !Cart || !qtyModalInput) return;
    Cart.setQty(qtyModalProduct.id, qtyModalInput.value);
    closeQtyModal();
    flashAddToast(qtyModalProduct.n);
    showUpsell(qtyModalProduct);
    refreshAfterCartChange();
  }

  function bindQtyModalOnce() {
    if (!qtyModal || qtyModal._bound) return;
    qtyModal._bound = true;
    qtyModal.querySelectorAll("[data-qty-close]").forEach((el) => {
      el.addEventListener("click", closeQtyModal);
    });
    if (qtyModalMinus) {
      qtyModalMinus.addEventListener("click", () => {
        if (!qtyModalInput || !qtyModalUnit) return;
        const n = Number(qtyModalInput.value) - qtyModalUnit.step;
        qtyModalInput.value = Cart.formatQty(Math.max(qtyModalUnit.min, n), qtyModalUnit.id);
      });
    }
    if (qtyModalPlus) {
      qtyModalPlus.addEventListener("click", () => {
        if (!qtyModalInput || !qtyModalUnit) return;
        const n = Number(qtyModalInput.value) + qtyModalUnit.step;
        qtyModalInput.value = Cart.formatQty(n, qtyModalUnit.id);
      });
    }
    if (qtyModalConfirm) {
      qtyModalConfirm.addEventListener("click", applyQtyModalValue);
    }
  }

  function bindCardActions(root) {
    root.querySelectorAll(".pcard-add:not(.pcard-add--muted)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const p = products.find((x) => x.id === id);
        if (!p || !Cart) return;
        showQtyModal(p);
      });
    });
  }

  function renderTrending() {
    if (!trendingGrid || !trendingWrap) return;
    const trending = trendingIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p) => p && Meta.isListed(p, categoryMins));
    if (!trending.length) {
      trendingWrap.hidden = true;
      return;
    }
    trendingWrap.hidden = false;
    const [hero, ...rest] = trending;
    let html = "";
    if (hero) {
      html +=
        '<div class="trending-hero-slot">' +
        buildCardHtml(hero, { featured: true, featuredTop: true, isTrending: true }) +
        "</div>";
    }
    if (rest.length) {
      html +=
        '<div class="pgrid pgrid--trending-rest">' +
        rest.map((p) => buildCardHtml(p, { featured: true, isTrending: true })).join("") +
        "</div>";
    }
    trendingGrid.innerHTML = html;
    bindCardActions(trendingGrid);
    updateLiveStrip();
    renderTodayPicks();
  }

  function renderTodayPicks() {
    const wrap = document.getElementById("todayPicks");
    if (!wrap) return;
    const picks = trendingIds
      .slice(0, 3)
      .map((id) => products.find((p) => p.id === id))
      .filter((p) => p && Meta.isListed(p, categoryMins));
    if (!picks.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML =
      '<p class="today-picks-lbl">🔥 Сьогодні беруть</p><div class="today-picks-row">' +
      picks
        .map((p) => {
          const pr = Meta.getPriceDisplay(p, categoryMins);
          const short = p.n.length > 28 ? p.n.slice(0, 26) + "…" : p.n;
          return (
            '<button type="button" class="today-pick" data-id="' +
            escapeHtml(p.id) +
            '"><span class="today-pick-name">' +
            escapeHtml(short) +
            '</span><span class="today-pick-price">' +
            escapeHtml(pr ? pr.text : "") +
            "</span></button>"
          );
        })
        .join("") +
      "</div>";
    wrap.querySelectorAll(".today-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = products.find((x) => x.id === btn.getAttribute("data-id"));
        if (p) showQtyModal(p);
      });
    });
  }

  function render() {
    const list = filterList(products);

    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="no-res">🔍 Нічого не знайдено</div>';
      return;
    }

    grid.innerHTML = list.map((p) => buildCardHtml(p, { compact: true })).join("");
    bindCardActions(grid);
  }

  function showUpsell(addedProduct) {
    if (!upsellPop) return;
    const suggestions = Meta.getUpsellIds(addedProduct, products);
    if (!suggestions.length) {
      upsellPop.hidden = true;
      return;
    }

    const label = Meta.getUpsellTitle(addedProduct);
    const showBundle =
      addedProduct.c === "Пельмені" &&
      Meta.BUNDLE_PRESETS &&
      Meta.BUNDLE_PRESETS.some((b) => b.id === "set-pelmeni");
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
      '<p class="upsell-title">🥛 ' +
      escapeHtml(label) +
      "</p>" +
      (showBundle
        ? '<button type="button" class="upsell-bundle" data-bundle="set-pelmeni">+ Додати набір (сметана + масло)</button>'
        : "") +
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
    const bundleBtn = upsellPop.querySelector("[data-bundle]");
    if (bundleBtn) {
      bundleBtn.addEventListener("click", () => {
        const preset = Meta.BUNDLE_PRESETS.find((b) => b.id === "set-pelmeni");
        if (!preset) return;
        preset.itemIds.forEach((id) => {
          const p = products.find((x) => x.id === id);
          if (p && Cart) Cart.addItem(p, 1);
        });
        upsellPop.hidden = true;
        flashAddToast("Набір додано");
        refreshAfterCartChange();
      });
    }
    upsellPop.querySelectorAll("[data-upsell-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-upsell-id");
        const p = products.find((x) => x.id === id);
        if (p && Cart) {
          upsellPop.hidden = true;
          showQtyModal(p);
        }
      });
    });

    clearTimeout(upsellPop._hide);
    upsellPop._hide = setTimeout(() => {
      upsellPop.hidden = true;
    }, 14000);
  }

  function peopleLabel(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "людина";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "людини";
    return "людей";
  }

  function updateLiveStrip() {
    const live = Meta.getLiveStats();
    const ordersEl = document.getElementById("liveOrders");
    const viewingEl = document.getElementById("liveViewing");
    const updatedEl = document.getElementById("liveUpdated");
    if (ordersEl) {
      ordersEl.textContent = `🔥 Сьогодні замовили: ${live.ordersToday} ${peopleLabel(live.ordersToday)}`;
    }
    if (viewingEl) {
      viewingEl.textContent = `👀 Зараз дивляться: ${live.viewing}`;
    }
    if (updatedEl) {
      updatedEl.textContent = `🕒 Оновлено: ${live.updatedMinAgo} хв тому`;
    }
    if (heroSocialLine) {
      heroSocialLine.textContent = `🔥 Сьогодні вже замовили ${live.ordersToday} ${peopleLabel(live.ordersToday)}`;
    }
    if (!heroHot || !heroHotItems) return;
    const hot = trendingIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p) => p && Meta.isListed(p, categoryMins))
      .slice(0, 3);
    if (!hot.length) {
      heroHot.hidden = true;
      return;
    }
    const short = hot.map((p) => {
      const n = p.n.split("«")[0].trim();
      return n.length > 22 ? n.slice(0, 20) + "…" : n;
    });
    heroHotItems.textContent = short.join(" • ");
    heroHot.hidden = false;
  }

  function renderBundles() {
    if (!bundleWrap || !bundleCard || !Meta.BUNDLE_PRESETS) return;
    const presets = Meta.BUNDLE_PRESETS.map((preset) => {
      const items = preset.itemIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p && Meta.isListed(p, categoryMins));
      return { preset, items };
    }).filter((x) => x.items.length >= 2);

    if (!presets.length) {
      bundleWrap.hidden = true;
      return;
    }

    const block = presets[0];
    const names = block.items.map((p) => escapeHtml(p.n)).join('<span> + </span>');
    bundleCard.innerHTML =
      '<p class="bundle-title">' +
      escapeHtml(block.preset.title) +
      "</p>" +
      '<p class="bundle-items">' +
      names +
      "</p>" +
      '<button type="button" class="bundle-add" id="bundleAddBtn">Додати набір у кошик</button>';

    bundleWrap.hidden = false;
    const btn = document.getElementById("bundleAddBtn");
    if (!btn || !Cart) return;
    btn.addEventListener("click", () => {
      btn.disabled = true;
      let added = 0;
      block.items.forEach((p) => {
        const r = Cart.addItem(p, 1);
        if (r && r.ok) added += 1;
      });
      btn.disabled = false;
      if (added) {
        flashAddToast("Набір додано в кошик");
        refreshAfterCartChange();
      }
    });
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
    setCatalogLoading(true);
    try {
      await loadProducts();
      await loadTrendingIds();
      bindQtyModalOnce();
      renderCategories();
      renderTrending();
      renderTodayPicks();
      updateLiveStrip();
      renderBundles();
      render();
      startSocialProof();
      setCatalogLoading(false);
    } catch (err) {
      console.error(err);
      setCatalogLoading(false);
      if (grid) {
        grid.hidden = false;
        grid.innerHTML =
          '<div class="no-res">Не вдалося завантажити каталог. Оновіть сторінку або спробуйте через хвилину.</div>';
      }
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
      const target = document.getElementById("catalog");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  document.querySelectorAll('.mob-tab[href="#catalog"]').forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const target = document.getElementById("catalog");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  window.addEventListener("magazin-cart-changed", () => {
    if (products.length) refreshAfterCartChange();
  });

  window.addEventListener("pageshow", () => {
    if (products.length) {
      updateHeroSocial();
      renderBundles();
      refreshAfterCartChange();
    }
  });

  init();
})();
