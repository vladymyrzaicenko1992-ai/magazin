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

  elements.grid.innerHTML = filtered
    .map((item) => {
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
  return item.image || CATEGORY_IMAGES[item.category] || FALLBACK_IMAGE;
}
