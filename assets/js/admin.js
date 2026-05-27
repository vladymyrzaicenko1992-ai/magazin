const Catalog = window.MagazinCatalog;

const listEl = document.getElementById("productsList");
const formMessageEl = document.getElementById("formMessage");
const newNameEl = document.getElementById("newName");
const newCategoryEl = document.getElementById("newCategory");
const newPriceEl = document.getElementById("newPrice");
const newImageEl = document.getElementById("newImage");
const newImageFileEl = document.getElementById("newImageFile");
const addBtn = document.getElementById("addBtn");
const resetBtn = document.getElementById("resetBtn");
const publishBtn = document.getElementById("publishBtn");
const restoreBtn = document.getElementById("restoreBtn");

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

function bindRowInputs(row, item) {
  const nameInput = row.querySelector('[data-field="n"]');
  const catInput = row.querySelector('[data-field="c"]');
  const priceInput = row.querySelector('[data-field="price"]');
  const imgInput = row.querySelector('[data-field="img"]');
  const imgFileInput = row.querySelector('[data-field="img-file"]');
  const imgPreview = row.querySelector('[data-field="img-preview"]');
  const priceView = row.querySelector('[data-field="price-view"]');
  const saveBtn = row.querySelector('[data-action="save"]');
  const delBtn = row.querySelector('[data-action="delete"]');

  async function persistRow() {
    item.n = nameInput.value.trim();
    item.c = catInput.value.trim();
    item.img = imgInput.value.trim();
    item.price = Catalog.parsePrice(priceInput.value);
    saveProducts();
    if (priceView) priceView.textContent = formatSavedPrice(item.price);
    if (imgPreview) imgPreview.src = item.img || "";
    setMessage("Зміни збережено");
  }

  if (saveBtn) saveBtn.addEventListener("click", () => { persistRow(); });
  nameInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  catInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  imgInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));
  priceInput.addEventListener("change", () => setMessage("Натисніть «Зберегти»"));

  if (imgFileInput) {
    imgFileInput.addEventListener("change", async () => {
      const file = imgFileInput.files && imgFileInput.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      imgInput.value = dataUrl;
      if (imgPreview) imgPreview.src = dataUrl;
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
  listEl.innerHTML = "";
  products.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <input type="text" value="${escapeHtml(item.n)}" data-field="n">
      <input type="text" value="${escapeHtml(item.c)}" data-field="c">
      <input type="number" min="0" step="0.01" value="${item.price ?? ""}" data-field="price" placeholder="Ціна, грн">
      <div>
        <span class="price-view" data-field="price-view">${formatSavedPrice(item.price)}</span>
      </div>
      <div>
        <input type="text" value="${escapeHtml(item.img)}" data-field="img" placeholder="URL або base64">
        <input type="file" accept="image/*" data-field="img-file">
        <img class="thumb" data-field="img-preview" src="${escapeHtml(item.img || "")}" alt="">
      </div>
      <button type="button" class="btn-primary row-actions" data-action="save">Зберегти</button>
      <button type="button" class="btn-danger" data-action="delete">Видалити</button>
    `;
    bindRowInputs(row, item);
    listEl.appendChild(row);
  });
}

if (addBtn) addBtn.addEventListener("click", async () => {
  const name = newNameEl.value.trim();
  const category = newCategoryEl.value.trim();
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

  products.unshift({ id, n: name, c: category, img: image, price });
  saveProducts();
  renderProducts();

  newNameEl.value = "";
  newCategoryEl.value = "";
  newImageEl.value = "";
  newPriceEl.value = "";
  if (newImageFileEl) newImageFileEl.value = "";
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

async function init() {
  products = await Catalog.loadCatalog();
  renderProducts();
}

init();
