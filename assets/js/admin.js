const {
  BASE_PRODUCTS,
  normalizeProduct,
  parsePrice,
  saveToStorage,
  loadCatalog,
  downloadProductsJson,
  markDeleted,
  clearDeletedIds,
  restoreAllProducts
} = window.MagazinCatalog;

const listEl = document.getElementById("productsList");
const formMessageEl = document.getElementById("formMessage");
const newNameEl = document.getElementById("newName");
const newCategoryEl = document.getElementById("newCategory");
const newPriceEl = document.getElementById("newPrice");
const newImageEl = document.getElementById("newImage");
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
  products = saveToStorage(products);
}

function setMessage(text) {
  formMessageEl.textContent = text;
}

function bindRowInputs(row, item) {
  const nameInput = row.querySelector('[data-field="n"]');
  const catInput = row.querySelector('[data-field="c"]');
  const priceInput = row.querySelector('[data-field="price"]');
  const imgInput = row.querySelector('[data-field="img"]');
  const delBtn = row.querySelector('[data-action="delete"]');

  function persistRow() {
    item.n = nameInput.value.trim();
    item.c = catInput.value.trim();
    item.img = imgInput.value.trim();
    item.price = parsePrice(priceInput.value);
    saveProducts();
    setMessage("Зміни збережено");
  }

  nameInput.addEventListener("change", persistRow);
  catInput.addEventListener("change", persistRow);
  imgInput.addEventListener("change", persistRow);
  priceInput.addEventListener("change", persistRow);
  priceInput.addEventListener("input", persistRow);

  delBtn.addEventListener("click", () => {
    markDeleted(item.id);
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
      <input type="text" value="${item.n.replace(/"/g, "&quot;")}" data-field="n">
      <input type="text" value="${item.c.replace(/"/g, "&quot;")}" data-field="c">
      <input type="number" min="0" step="0.01" value="${item.price ?? ""}" data-field="price" placeholder="Ціна, грн">
      <input type="text" value="${item.img.replace(/"/g, "&quot;")}" data-field="img">
      <button type="button" class="btn-danger" data-action="delete">Видалити</button>
    `;
    bindRowInputs(row, item);
    listEl.appendChild(row);
  });
}

if (addBtn) addBtn.addEventListener("click", () => {
  const name = newNameEl.value.trim();
  const category = newCategoryEl.value.trim();
  const image = newImageEl.value.trim();
  const price = parsePrice(newPriceEl.value);

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

  products.unshift({ id, n: name, c: category, img: image, price });
  saveProducts();
  renderProducts();

  newNameEl.value = "";
  newCategoryEl.value = "";
  newImageEl.value = "";
  newPriceEl.value = "";
  setMessage("Товар додано");
});

if (resetBtn) resetBtn.addEventListener("click", () => {
  restoreAllProducts();
  products = BASE_PRODUCTS.map(normalizeProduct);
  saveProducts();
  renderProducts();
  setMessage("Список скинуто до базового");
});

if (restoreBtn) restoreBtn.addEventListener("click", async () => {
    restoreAllProducts();
    products = await loadCatalog();
    saveProducts();
    renderProducts();
    setMessage("Усі товари відновлено");
  });

if (publishBtn) publishBtn.addEventListener("click", () => {
  saveProducts();
  downloadProductsJson(products, "products.json");
  setMessage("Файл products.json завантажено. Замініть assets/data/products.json і зробіть push.");
});

async function init() {
  products = await loadCatalog();
  renderProducts();
}

init();
