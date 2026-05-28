(function () {
  const CAT_META = {
    Усі: { emoji: "✨", label: "Усі" },
    Вареники: { emoji: "🥟", label: "Вареники", tagline: "ручна ліпка" },
    Млинці: { emoji: "🥞", label: "Млинці", tagline: "домашні" },
    Додатково: { emoji: "🥗", label: "Додатково", tagline: "до столу" },
    Котлети: { emoji: "🍖", label: "Котлети", tagline: "соковиті" },
    Пельмені: { emoji: "🥟", label: "Пельмені", tagline: "7 хв до тарілки" },
    Хінкалі: { emoji: "🥟", label: "Хінкалі", tagline: "7 хв" },
    Молочка: { emoji: "🥛", label: "Молочка", tagline: "фермерська" }
  };

  /** Резерв, якщо Google ще не повернув топ за 7 днів */
  const TRENDING_IDS = ["pel-dom", "var-kartoshka", "kot-babush", "hink-dom"];

  const UPSELL_BY_CATEGORY = {
    Пельмені: ["smetana", "maslo-vershk"],
    Хінкалі: ["smetana"],
    Вареники: ["smetana"],
    Котлети: ["smetana"],
    Млинці: ["smetana", "tvorog"]
  };

  const HIT_IDS = new Set([
    "pel-dom",
    "pel-babush",
    "var-kartoshka",
    "kot-babush",
    "kot-dom-maslo",
    "hink-dom",
    "smetana"
  ]);

  function getCatMeta(category) {
    return CAT_META[category] || { emoji: "🍽️", label: category || "", tagline: "домашнє" };
  }

  function getDisplayTitle(product) {
    return String(product.n || "").trim();
  }

  /** Підзаголовок: emoji+категорія або «Домашні • …», без повтору повної назви */
  function getDisplaySubtitle(product) {
    const meta = getCatMeta(product.c);
    const title = getDisplayTitle(product).toLowerCase();
    const cat = meta.label.toLowerCase();
    if (title === cat || title.startsWith(cat + " ") || title.startsWith(cat + "«")) {
      return `${meta.emoji} ${meta.label}`;
    }
    return `Домашні • ${meta.tagline}`;
  }

  function getDisplayTagline(product) {
    return getDisplaySubtitle(product);
  }

  function getBadges(product) {
    const badges = [];
    const n = String(product.n || "").toLowerCase();
    const c = product.c;

    if (HIT_IDS.has(product.id) || TRENDING_IDS.includes(product.id)) {
      badges.push({ text: "🔥 Хіт", cls: "badge-hot" });
    }
    if (c === "Пельмені" || c === "Хінкалі") {
      badges.push({ text: "⚡ 7 хв", cls: "badge-fast" });
    }
    if (n.includes("домашн") || n.includes("бабус")) {
      badges.push({ text: "👨‍👩‍👧 Для сімʼї", cls: "badge-fam" });
    }
    if (n.includes("вершков") || n.includes("сметан")) {
      badges.push({ text: "🧈 Вершкові", cls: "badge-cream" });
    }
    if (n.includes("соковит")) {
      badges.push({ text: "🥟 Соковиті", cls: "badge-juicy" });
    }

    const seen = new Set();
    return badges.filter((b) => {
      if (seen.has(b.text)) return false;
      seen.add(b.text);
      return true;
    }).slice(0, 2);
  }

  function getUpsellLabel(product) {
    const map = {
      Пельмені: "пельменів",
      Хінкалі: "хінкалі",
      Вареники: "вареників",
      Котлети: "котлет",
      Млинці: "млинців",
      Молочка: "набору"
    };
    return map[product.c] || product.c.toLowerCase();
  }

  function getUpsellIds(product, allProducts) {
    const ids = UPSELL_BY_CATEGORY[product.c] || ["smetana"];
    const inCart = new Set(
      (window.MagazinCart && window.MagazinCart.loadCart().map((x) => x.id)) || []
    );
    inCart.add(product.id);
    return ids
      .filter((id) => !inCart.has(id))
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p) => p && parsePrice(p) !== null)
      .slice(0, 2);
  }

  function parsePrice(product) {
    if (!window.MagazinCart) return null;
    return window.MagazinCart.parsePrice(product.price);
  }

  function buildCategoryMins(products) {
    const mins = {};
    products.forEach((p) => {
      const v = parsePrice(p);
      if (v === null) return;
      const c = p.c;
      if (mins[c] === undefined || v < mins[c]) mins[c] = v;
    });
    return mins;
  }

  function getPriceDisplay(product, categoryMins) {
    const v = parsePrice(product);
    if (v !== null) return { text: `${Math.round(v)} грн`, canOrder: true };
    const min = categoryMins[product.c];
    if (min != null) return { text: `від ${Math.round(min)} грн`, canOrder: false };
    return null;
  }

  function isListed(product, categoryMins) {
    return getPriceDisplay(product, categoryMins) !== null;
  }

  window.MagazinStoreMeta = {
    CAT_META,
    TRENDING_IDS,
    getCatMeta,
    getDisplayTitle,
    getDisplaySubtitle,
    getDisplayTagline,
    getUpsellLabel,
    getBadges,
    getUpsellIds,
    buildCategoryMins,
    getPriceDisplay,
    isListed,
    parsePrice
  };
})();
