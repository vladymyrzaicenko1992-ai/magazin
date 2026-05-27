(function () {
  const Catalog = window.MagazinCatalog;
  if (!Catalog) {
    console.error("MagazinCatalog не завантажено");
    return;
  }

  const { loadCatalog, formatPrice } = Catalog;
  const CAT_ORDER = ["Усі", "Вареники", "Млинці", "Додатково", "Котлети", "Пельмені", "Хінкалі", "Молочка"];
  const catsEl = document.getElementById("cats");
  const grid = document.getElementById("pgrid");
  const search = document.getElementById("searchInput");
  const lbl = document.getElementById("secLbl");

  if (!catsEl || !grid) {
    console.error("Не знайдено контейнери каталогу");
    return;
  }

  let products = [];
  let activeCat = "Усі";
  let q = "";

  async function loadProducts() {
    products = await loadCatalog();
  }

  function renderCategories() {
    const presentCats = new Set(products.map((x) => x.c));
    const cats = CAT_ORDER.filter((c) => c === "Усі" || presentCats.has(c));
    catsEl.innerHTML = "";

    cats.forEach((cat) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cat-btn" + (cat === activeCat ? " active" : "");
      b.textContent = cat;
      b.addEventListener("click", () => {
        activeCat = cat;
        document.querySelectorAll(".cat-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        if (lbl) lbl.textContent = cat === "Усі" ? "Усі товари" : cat;
        render();
      });
      catsEl.appendChild(b);
    });
  }

  function render() {
    const lq = q.toLowerCase().trim();
    const list = products.filter(
      (p) =>
        (activeCat === "Усі" || p.c === activeCat) &&
        (!lq || p.n.toLowerCase().includes(lq) || p.c.toLowerCase().includes(lq))
    );

    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="no-res">🔍 Нічого не знайдено</div>';
      return;
    }

    list.forEach((p, i) => {
      const d = document.createElement("div");
      d.className = "pcard";
      d.style.animationDelay = i * 0.028 + "s";
      const img = p.img ? encodeURI(p.img) : "";
      d.innerHTML =
        '<div class="pcard-img">' +
        (img ? '<img src="' + img + '" alt="" loading="lazy">' : "") +
        "</div>" +
        '<div class="pcard-body">' +
        '<div class="pcard-name">' + escapeHtml(p.n) + "</div>" +
        '<div class="pcard-cat">' + escapeHtml(p.c) + "</div>" +
        '<div class="pcard-price">' + escapeHtml(formatPrice(p.price)) + "</div>" +
        "</div>";
      const imgEl = d.querySelector("img");
      if (imgEl) imgEl.alt = p.n;
      grid.appendChild(d);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function init() {
    try {
      await loadProducts();
      renderCategories();
      render();
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

  init();
})();
