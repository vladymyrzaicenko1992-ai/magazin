const Catalog = window.MagazinCatalog;

const listEl = document.getElementById("productsList");
const formMessageEl = document.getElementById("formMessage");
const newNameEl = document.getElementById("newName");
const newCategoryEl = document.getElementById("newCategory");
const newUnitEl = document.getElementById("newUnit");
const newPriceEl = document.getElementById("newPrice");
const newImageEl = document.getElementById("newImage");
const newImageFileEl = document.getElementById("newImageFile");
const addBtn = document.getElementById("addBtn");
const resetBtn = document.getElementById("resetBtn");
const publishBtn = document.getElementById("publishBtn");
const restoreBtn = document.getElementById("restoreBtn");
const googleWebAppUrlEl = document.getElementById("googleWebAppUrl");
const saveGoogleUrlBtn = document.getElementById("saveGoogleUrlBtn");
const syncGoogleBtn = document.getElementById("syncGoogleBtn");
const loadGoogleBtn = document.getElementById("loadGoogleBtn");
const googleMessageEl = document.getElementById("googleMessage");
const productsCountEl = document.getElementById("productsCount");
const newPhotoFrame = document.getElementById("newPhotoFrame");
const newPhotoPreview = document.getElementById("newPhotoPreview");

let products = [];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function saveProducts() {
  products = Catalog.saveToStorage(products);
}

function setMessage(text) {
  formMessageEl.textContent = text;
}

function setGoogleMessage(text) {
  if (googleMessageEl) googleMessageEl.textContent = text;
}

function categoryOptionsHtml(selected, categories) {
  const cats = categories.slice();
  const sel = String(selected || "").trim();
  if (sel && !cats.includes(sel)) cats.push(sel);
  return cats
    .map(
      (c) =>
        `<option value="${escapeHtml(c)}"${c === sel ? " selected" : ""}>${escapeHtml(c)}</option>`
    )
    .join("");
}

function unitOptionsHtml(selected) {
  const sel = Catalog.normalizeUnit(selected);
  return Catalog.PRODUCT_UNITS.map(
    (u) =>
      `<option value="${escapeHtml(u.id)}"${u.id === sel ? " selected" : ""}>${escapeHtml(u.label)}</option>`
  ).join("");
}

function fillAddFormSelects() {
  if (newCategoryEl) {
    newCategoryEl.innerHTML = categoryOptionsHtml(
      newCategoryEl.value || Catalog.CATEGORY_PRESETS[0],
      Catalog.getCategoryList(products)
    );
  }
  if (newUnitEl) {
    newUnitEl.innerHTML = unitOptionsHtml(newUnitEl.value || "pcs");
  }
}

async function persistToCloud() {
  const url = await Catalog.getGoogleWebAppUrl();
  if (!url) {
    setMessage("Збережено лише в браузері. Підключіть Google у блоці вище.");
    return false;
  }
  const result = await Catalog.saveToGoogle(url, products);
  const check = await Catalog.fetchFromGoogle(url);
  const savedCount = result.saved ?? products.length;
  if (check.length < Math.min(products.length, 1)) {
    throw new Error("Після збереження Google повернув порожній каталог");
  }
  setMessage(`Збережено в Google (${savedCount} товарів) і в браузері`);
  setGoogleMessage("Остання синхронізація: зараз");
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSavedPrice(value) {
  const price = Catalog.parsePrice(value);
  return price === null ? "Ціна не вказана" : `Збережена ціна: ${price.toFixed(2)} грн`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(file);
  });
}

function updatePhotoPreview(frame, imgEl, src) {
  if (!frame || !imgEl) return;
  const url = String(src || "").trim();
  if (url) {
    imgEl.src = url;
    imgEl.hidden = false;
    frame.classList.add("has-img");
  } else {
    imgEl.removeAttribute("src");
    imgEl.hidden = true;
    frame.classList.remove("has-img");
  }
}

let addPhotoPreviewBound = false;

function bindAddPhotoPreview() {
  if (addPhotoPreviewBound || !newImageFileEl) return;
  addPhotoPreviewBound = true;
  newImageFileEl.addEventListener("change", async () => {
    const file = newImageFileEl.files && newImageFileEl.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (newImageEl) newImageEl.value = dataUrl;
    updatePhotoPreview(newPhotoFrame, newPhotoPreview, dataUrl);
  });
  if (newImageEl) {
    newImageEl.addEventListener("input", () => {
      updatePhotoPreview(newPhotoFrame, newPhotoPreview, newImageEl.value);
    });
  }
}

function bindRowInputs(row, item) {
  const nameInput = row.querySelector('[data-field="n"]');
  const catInput = row.querySelector('[data-field="c"]');
  const unitInput = row.querySelector('[data-field="unit"]');
  const priceInput = row.querySelector('[data-field="price"]');
  const imgInput = row.querySelector('[data-field="img"]');
  const imgFileInput = row.querySelector('[data-field="img-file"]');
  const imgPreview = row.querySelector('[data-field="img-preview"]');
  const photoFrame = row.querySelector('[data-field="photo-frame"]');
  const priceView = row.querySelector('[data-field="price-view"]');
  const saveBtn = row.querySelector('[data-action="save"]');
  const delBtn = row.querySelector('[data-action="delete"]');

  updatePhotoPreview(photoFrame, imgPreview, item.img);

  async function persistRow() {
    item.n = nameInput.value.trim();
    item.c = catInput.value.trim();
    item.unit = Catalog.normalizeUnit(unitInput.value);
    item.img = imgInput.value.trim();
    item.price = Catalog.parsePrice(priceInput.value);
    saveProducts();
    if (priceView) priceView.textContent = formatSavedPrice(item.price);
    updatePhotoPreview(photoFrame, imgPreview, item.img);
    try {
      await persistToCloud();
    } catch (err) {
      setMessage("Збережено в браузері. Google: " + err.message);
    }
  }

  if (saveBtn) saveBtn.addEventListener("click", () => { persistRow(); });
  nameInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  catInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  unitInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  imgInput.addEventListener("input", () => {
    updatePhotoPreview(photoFrame, imgPreview, imgInput.value);
    setMessage("Натисніть «Зберегти»");
  });
  priceInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));

  if (imgFileInput) {
    imgFileInput.addEventListener("change", async () => {
      const file = imgFileInput.files && imgFileInput.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      imgInput.value = dataUrl;
      updatePhotoPreview(photoFrame, imgPreview, dataUrl);
      setMessage("Фото завантажено, натисніть «Зберегти»");
    });
  }

  delBtn.addEventListener("click", () => {
    Catalog.markDeleted(item.id);
    products = products.filter((p) => p.id !== item.id);
    saveProducts();
    renderProducts();
    setMessage("Товар приховано з вітрини");
  });
}

function renderProducts() {
  const categories = Catalog.getCategoryList(products);
  listEl.innerHTML = "";
  if (productsCountEl) {
    productsCountEl.textContent = products.length ? `(${products.length})` : "";
  }
  products.forEach((item) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const hasImg = Boolean(String(item.img || "").trim());
    card.innerHTML = `
      <div class="product-card-body">
        <div class="product-row product-row--name">
          <label class="field">
            <span class="field-label">Назва</span>
            <input type="text" value="${escapeHtml(item.n)}" data-field="n">
          </label>
        </div>
        <div class="product-row product-row--meta">
          <label class="field">
            <span class="field-label">Категорія</span>
            <select data-field="c">${categoryOptionsHtml(item.c, categories)}</select>
          </label>
          <label class="field">
            <span class="field-label">Одиниця</span>
            <select data-field="unit">${unitOptionsHtml(item.unit)}</select>
          </label>
          <label class="field">
            <span class="field-label">Ціна, грн</span>
            <input type="number" min="0" step="0.01" value="${item.price ?? ""}" data-field="price" placeholder="0">
            <span class="price-view" data-field="price-view">${formatSavedPrice(item.price)}</span>
          </label>
        </div>
        <div class="product-row product-row--img">
          <label class="field">
            <span class="field-label">Шлях до фото</span>
            <input type="text" value="${escapeHtml(item.img)}" data-field="img" placeholder="assets/img/...">
          </label>
        </div>
        <div class="product-actions">
          <button type="button" class="btn-primary" data-action="save">Зберегти</button>
          <button type="button" class="btn-danger" data-action="delete">Видалити</button>
        </div>
      </div>
      <div class="product-photo-wrap">
        <div class="product-photo-frame${hasImg ? " has-img" : ""}" data-field="photo-frame">
          <img class="product-photo" data-field="img-preview" alt="${escapeHtml(item.n)}"${hasImg ? ` src="${escapeHtml(item.img)}"` : " hidden"}>
          <span class="product-photo-empty" aria-hidden="true">🍽️</span>
        </div>
        <input type="file" accept="image/*" data-field="img-file" class="product-photo-file">
      </div>
    `;
    bindRowInputs(card, item);
    listEl.appendChild(card);
  });
  fillAddFormSelects();
}

if (addBtn) addBtn.addEventListener("click", async () => {
  const name = newNameEl.value.trim();
  const category = newCategoryEl.value.trim();
  const unit = Catalog.normalizeUnit(newUnitEl && newUnitEl.value);
  let image = newImageEl.value.trim();
  const price = Catalog.parsePrice(newPriceEl.value);

  if (!name || !category) {
    setMessage("Вкажіть назву і категорію");
    return;
  }

  const baseId = slugify(name) || `item-${Date.now()}`;
  let id = baseId;
  let counter = 1;
  while (products.some((p) => p.id === id)) {
    counter += 1;
    id = `${baseId}-${counter}`;
  }

  const newFile = newImageFileEl && newImageFileEl.files && newImageFileEl.files[0];
  if (newFile) {
    image = await fileToDataUrl(newFile);
  }

  products.unshift({ id, n: name, c: category, unit, img: image, price });
  saveProducts();
  renderProducts();
  try {
    await persistToCloud();
  } catch (err) {
    setMessage("Товар додано локально. Google: " + err.message);
  }

  newNameEl.value = "";
  newImageEl.value = "";
  newPriceEl.value = "";
  if (newImageFileEl) newImageFileEl.value = "";
  updatePhotoPreview(newPhotoFrame, newPhotoPreview, "");
  setMessage("Товар додано");
});

if (resetBtn) resetBtn.addEventListener("click", () => {
  Catalog.restoreAllProducts();
  products = Catalog.BASE_PRODUCTS.map(Catalog.normalizeProduct);
  saveProducts();
  renderProducts();
  setMessage("Список скинуто до базового");
});

if (restoreBtn) restoreBtn.addEventListener("click", async () => {
  Catalog.restoreAllProducts();
  products = await Catalog.loadCatalog();
    saveProducts();
    renderProducts();
    setMessage("Усі товари відновлено");
  });

if (publishBtn) publishBtn.addEventListener("click", () => {
  saveProducts();
  Catalog.downloadProductsJson(products, "products.json");
  setMessage("Файл products.json завантажено. Замініть assets/data/products.json і зробіть push.");
});

if (saveGoogleUrlBtn) {
  saveGoogleUrlBtn.addEventListener("click", async () => {
    const url = googleWebAppUrlEl.value.trim();
    if (!url) {
      setGoogleMessage("Вкажіть URL веб-додатку");
      return;
    }
    Catalog.setGoogleWebAppUrl(url);
    setGoogleMessage("URL збережено в цьому браузері");
  });
}

if (syncGoogleBtn) {
  syncGoogleBtn.addEventListener("click", async () => {
    const url = googleWebAppUrlEl?.value.trim() || (await Catalog.getGoogleWebAppUrl());
    if (!url) {
      setGoogleMessage("Спочатку вкажіть і збережіть URL");
      return;
    }
    Catalog.setGoogleWebAppUrl(url);
    try {
      saveProducts();
      await Catalog.saveToGoogle(url, products);
      setGoogleMessage(`У Google збережено ${products.length} товарів`);
      setMessage("Каталог синхронізовано з Google");
    } catch (err) {
      setGoogleMessage("Помилка: " + err.message);
    }
  });
}

if (loadGoogleBtn) {
  loadGoogleBtn.addEventListener("click", async () => {
    const url = await Catalog.getGoogleWebAppUrl();
    if (!url) {
      setGoogleMessage("URL не налаштовано");
      return;
    }
    try {
      products = await Catalog.fetchFromGoogle(url);
      products = Catalog.saveToStorage(products);
      renderProducts();
      setGoogleMessage("Завантажено з Google");
      setMessage("Список оновлено з Google");
    } catch (err) {
      setGoogleMessage("Помилка: " + err.message);
    }
  });
}

async function init() {
  bindAddPhotoPreview();
  products = await Catalog.loadCatalog();
  fillAddFormSelects();
  renderProducts();
  const url = await Catalog.getGoogleWebAppUrl();
  if (googleWebAppUrlEl && url) googleWebAppUrlEl.value = url;
  if (url) setGoogleMessage("Google підключено");
  else setGoogleMessage("Google не підключено — дані лише в браузері");
}

function bootAdmin() {
  init();
}

try {
  if (sessionStorage.getItem("magazin-admin-ok") === "1") bootAdmin();
} catch (_) {}

window.addEventListener("magazin-admin-ready", bootAdmin);
