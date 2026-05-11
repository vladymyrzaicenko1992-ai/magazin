const STORAGE_KEY = "magazz_bookmarks_v1";
const FALLBACK_IMAGE = "assets/img/products/dumplings/Богатирські (Яловичина + курка).png";
const CATEGORY_IMAGES = {
  "Вареники": "assets/img/products/vareniki/Вареники з картоплею.png",
  "Блинчики": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png",
  "Котлеты": "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).png",
  "Пельмени": "assets/img/products/dumplings/Богатирські (Яловичина + курка).png",
  "Хинкали": "assets/img/products/dumplings/Хінкалі «Домашні» .png",
  "Молочка": "assets/img/products/molochka/Сметана фермерська.png",
  "Дополнительно": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png"
};
const PRODUCT_IMAGES = {
  "var-kartoshka": "assets/img/products/vareniki/Вареники з картоплею.png",
  "var-kapusta": "assets/img/products/vareniki/Вареники з капустою.png",
  "var-serdce-pechen": "assets/img/products/vareniki/Вареники з серцем-печінкою.png",
  "var-myaso-chesnok": "assets/img/products/vareniki/Вареники з м'ясом та часником.png",
  "var-tvorog-sladkiy": "assets/img/products/vareniki/Вареники з солодким творогом.png",
  "bl-myaso-dom": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png",
  "bl-tvorog-dom": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png",
  "bend-myaso": "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png",
  "bend-kapusta": "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png",
  "cheb-myaso-syr": "assets/img/products/bliny/Чебуреки (з м'ясом та сиром).png",
  "syrniki-zhar": "assets/img/products/bliny/Сирники смажені.png",
  "zrazy-myas-kap": "assets/img/products/vareniki/Зрази смажені (з м'ясом , капустою).png",
  "sosiska-v-teste": "assets/img/products/bliny/Сосиска в тісті.png",
  "gnizdechka-myaso": "assets/img/products/bliny/Гніздечка з м'ясом.png",
  "ovoshi-zamorozh": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png",
  "kartoplya-fri": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png",
  "kot-babush": "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).png",
  "kot-yozhik": "assets/img/products/cutlets/Котлети «Їжачок» (курка).png",
  "kot-syr": "assets/img/products/cutlets/Котлети «З сиром» (яловичина + сир).png",
  "kot-po-kiev-farsh": "assets/img/products/cutlets/Котлети «По-київськи» (курячий фарш + масло + зелень).png",
  "kot-sviny": "assets/img/products/cutlets/Котлети зі свинини.png",
  "kot-shkoln": "assets/img/products/cutlets/Котлети «Шкільні» (курка).png",
  "naggets": "assets/img/products/cutlets/Нагетси курячі.png",
  "grechaniki": "assets/img/products/cutlets/Гречаники домашні (свинина + яловичина + гречка).png",
  "kot-kiev-file": "assets/img/products/cutlets/Котлети «Київські» (філе + масло + зелень).png",
  "kordon-blu": "assets/img/products/cutlets/Котлети «Кордон-Блю» (філе + шинка + сир).png",
  "kot-sokovit": "assets/img/products/cutlets/Котлети «Соковиті» (яловичина + курка).png",
  "kot-dom-maslo": "assets/img/products/cutlets/Котлети «Домашні» (свинина + яловичина + масло).png",
  "shnic-dom": "assets/img/products/cutlets/Шніцель домашній (яловичина).png",
  "kot-burger": "assets/img/products/cutlets/Котлети для бургерів (яловичина).png",
  "kot-rublen": "assets/img/products/cutlets/Котлети рублені (свинина + яловичина + курка).png",
  "golubcy": "assets/img/products/cutlets/Голубці (свинина + яловичина).png",
  "perec-farsh": "assets/img/products/cutlets/Перець фарширований (свинина + яловичина).png",
  "pel-bogatyr": "assets/img/products/dumplings/Богатирські (Яловичина + курка).png",
  "pel-bulmeni": "assets/img/products/dumplings/Бульмені (Яловичина + бульйон).png",
  "pel-dom": "assets/img/products/dumplings/Пельмені «Домашні» (свинина).jpg",
  "pel-kozackie": "assets/img/products/dumplings/Козацькі (Свинина + яловичина).png",
  "pel-kurinye": "assets/img/products/dumplings/Пельмені «Курячі».jpg",
  "pel-malyshki": "assets/img/products/dumplings/Пельмені «Малюки» .png",
  "pel-babush": "assets/img/products/dumplings/Бабусині (Свинина + яловичина + курка).png",
  "pel-vershk": "assets/img/products/dumplings/Вершкові (Свинина + яловичина + вершкове масло).png",
  "ravioli": "assets/img/products/dumplings/Пельмені «Равіолі» .png",
  "hink-dom": "assets/img/products/dumplings/Хінкалі «Домашні» .png",
  "hink-kavkaz": "assets/img/products/dumplings/Хінкалі «Кавказькі» (яловичина + курка + зелень + паприка + базилік).png",
  "hink-shah": "assets/img/products/dumplings/Хінкалі «Шах» (свинина + яловичина + зелень).png",
  "smetana": "assets/img/products/molochka/Сметана фермерська.png",
  "tvorog": "assets/img/products/molochka/Творог домашній .png",
  "sirna-masa": "assets/img/products/molochka/Сирна маса з родзинками .png",
  "yaitsa": "assets/img/products/qw/яйця.jpg"
};

const state = {
  products: [],
  bookmarks: JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
  category: "Все",
  query: ""
};

const elements = {
  grid: document.getElementById("productsGrid"),
  bookmarksList: document.getElementById("bookmarksList"),
  bookmarkCount: document.getElementById("bookmarkCount"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  panes: document.querySelectorAll(".tab-pane"),
  clearBookmarksBtn: document.getElementById("clearBookmarksBtn"),
  qrDialog: document.getElementById("qrDialog"),
  qrImage: document.getElementById("qrImage"),
  showQrBtn: document.getElementById("showQrBtn"),
  closeQrBtn: document.getElementById("closeQrBtn"),
  themeToggle: document.getElementById("themeToggle")
};

init();

async function init() {
  await loadProducts();
  renderCategories();
  renderProducts();
  renderBookmarks();
  bindEvents();
}

async function loadProducts() {
  const response = await fetch("assets/data/products.json");
  state.products = await response.json();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  elements.clearBookmarksBtn.addEventListener("click", () => {
    state.bookmarks = [];
    persistBookmarks();
    renderBookmarks();
    renderProducts();
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  elements.showQrBtn.addEventListener("click", openQrDialog);
  elements.closeQrBtn.addEventListener("click", () => elements.qrDialog.close());

  elements.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("alt-theme");
  });
}

function renderCategories() {
  const categories = ["Все", ...new Set(state.products.map((item) => item.category))];

  elements.categoryFilter.innerHTML = categories
    .map((category) => {
      const activeClass = category === state.category ? "active" : "";
      return `<button class="category-btn ${activeClass}" data-category="${category}">${category}</button>`;
    })
    .join("");

  elements.categoryFilter.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const bookmarkIds = new Set(state.bookmarks.map((item) => item.id));

  const filtered = state.products.filter((item) => {
    const byCategory = state.category === "Все" || item.category === state.category;
    const byQuery = item.name.toLowerCase().includes(state.query);
    return byCategory && byQuery;
  });

  if (filtered.length === 0) {
    elements.grid.innerHTML = `<p class="muted">Ничего не найдено. Попробуй другой запрос.</p>`;
    return;
  }

  const grouped = groupByCategory(filtered);
  elements.grid.innerHTML = grouped
    .map(({ category, items }) => {
      const cards = items.map((item) => {
      const isBookmarked = bookmarkIds.has(item.id);
      const buttonLabel = isBookmarked ? "Убрать из закладок" : "Добавить в мои закладки";

      return `
        <article class="product-card">
          <img src="${encodeURI(getImageForProduct(item))}" alt="${item.name}" loading="lazy" onerror="this.src='${encodeURI(FALLBACK_IMAGE)}'">
          <div class="product-body">
            <h3>${item.name}</h3>
            <div class="product-meta">
              <span>${item.category}</span>
            </div>
            <button class="bookmark-btn" data-id="${item.id}">${buttonLabel}</button>
          </div>
        </article>
      `;
      }).join("");

      return `
        <section class="category-section">
          <h3 class="category-title">${category}</h3>
          <div class="products-grid">${cards}</div>
        </section>
      `;
    })
    .join("");

  elements.grid.querySelectorAll(".bookmark-btn").forEach((button) => {
    button.addEventListener("click", () => toggleBookmark(button.dataset.id));
  });
}

function toggleBookmark(productId) {
  const existing = state.bookmarks.find((item) => item.id === productId);
  if (existing) {
    state.bookmarks = state.bookmarks.filter((item) => item.id !== productId);
  } else {
    const product = state.products.find((item) => item.id === productId);
    if (product) state.bookmarks.push(product);
  }

  persistBookmarks();
  renderBookmarks();
  renderProducts();
}

function renderBookmarks() {
  elements.bookmarkCount.textContent = state.bookmarks.length;

  if (state.bookmarks.length === 0) {
    elements.bookmarksList.innerHTML = `<p class="muted">Пока пусто. Добавь товары из меню.</p>`;
    return;
  }

  elements.bookmarksList.innerHTML = state.bookmarks
    .map((item) => {
      return `
        <div class="bookmark-item">
          <div>
            <strong>${item.name}</strong>
            <p class="muted">${item.category}</p>
          </div>
          <button class="remove-btn" data-id="${item.id}">Удалить</button>
        </div>
      `;
    })
    .join("");

  elements.bookmarksList.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => toggleBookmark(button.dataset.id));
  });
}

function persistBookmarks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookmarks));
}

function switchTab(tabId) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  elements.panes.forEach((pane) => {
    pane.classList.toggle("active", pane.id === tabId);
  });
}

function openQrDialog() {
  const url = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  elements.qrImage.src = qrUrl;
  elements.qrDialog.showModal();
}

function getImageForProduct(item) {
  return PRODUCT_IMAGES[item.id] || item.image || CATEGORY_IMAGES[item.category] || FALLBACK_IMAGE;
}

function groupByCategory(items) {
  if (state.category !== "Все") {
    return [{ category: state.category, items }];
  }

  const order = ["Пельмени", "Хинкали", "Вареники", "Блинчики", "Котлеты", "Молочка", "Дополнительно"];
  return order
    .filter((category) => items.some((item) => item.category === category))
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    }));
}
