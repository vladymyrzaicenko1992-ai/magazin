const STORAGE_KEY = "magazin-products-v1";

const BASE_PRODUCTS = [
  { id: "var-kartoshka", n: "Вареники з картоплею", c: "Вареники", img: "assets/img/products/vareniki/Вареники з картоплею.png", price: null },
  { id: "var-kapusta", n: "Вареники з капустою", c: "Вареники", img: "assets/img/products/vareniki/Вареники з капустою.png", price: null },
  { id: "var-serdce-pechen", n: "Вареники з серцем і печінкою", c: "Вареники", img: "assets/img/products/vareniki/Вареники з серцем-печінкою.png", price: null },
  { id: "var-myaso-chesnok", n: "Вареники з м'ясом і часником", c: "Вареники", img: "assets/img/products/vareniki/Вареники з м'ясом та часником.png", price: null },
  { id: "var-tvorog-sladkiy", n: "Вареники з солодким сиром", c: "Вареники", img: "assets/img/products/vareniki/Вареники з солодким творогом.png", price: null },
  { id: "bl-myaso-dom", n: "Млинці домашні з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png", price: null },
  { id: "bl-tvorog-dom", n: "Млинці домашні з сиром", c: "Млинці", img: "assets/img/products/bliny/Блинчики (з м'ясом, творогом).png", price: null },
  { id: "bend-myaso", n: "Бендерики з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png", price: null },
  { id: "bend-kapusta", n: "Бендерики з капустою", c: "Млинці", img: "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).png", price: null },
  { id: "cheb-myaso-syr", n: "Чебуреки з м'ясом і сиром", c: "Млинці", img: "assets/img/products/bliny/Чебуреки (з м'ясом та сиром).png", price: null },
  { id: "syrniki-zhar", n: "Сирники смажені", c: "Млинці", img: "assets/img/products/bliny/Сирники смажені.png", price: null },
  { id: "zrazy-myas-kap", n: "Зрази смажені", c: "Млинці", img: "assets/img/products/vareniki/Зрази смажені (з м'ясом , капустою).png", price: null },
  { id: "sosiska-v-teste", n: "Сосиска в тісті", c: "Млинці", img: "assets/img/products/bliny/Сосиска в тісті.png", price: null },
  { id: "gnizdechka-myaso", n: "Гніздечка з м'ясом", c: "Млинці", img: "assets/img/products/bliny/Гніздечка з м'ясом.png", price: null },
  { id: "ovoshi-zamorozh", n: "Заморожені овочі", c: "Додатково", img: "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png", price: null },
  { id: "kartoplya-fri", n: "Картопля фрі", c: "Додатково", img: "assets/img/products/bliny/Заморожені овочі, Картопля фрі.png", price: null },
  { id: "kot-babush", n: "Котлети «Бабусині»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).png", price: null },
  { id: "kot-yozhik", n: "Котлети «Їжачок»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Їжачок» (курка).png", price: null },
  { id: "kot-syr", n: "Котлети з сиром", c: "Котлети", img: "assets/img/products/cutlets/Котлети «З сиром» (яловичина + сир).png", price: null },
  { id: "kot-po-kiev-farsh", n: "Котлети по-київськи", c: "Котлети", img: "assets/img/products/cutlets/Котлети «По-київськи» (курячий фарш + масло + зелень).png", price: null },
  { id: "kot-sviny", n: "Котлети зі свинини", c: "Котлети", img: "assets/img/products/cutlets/Котлети зі свинини.png", price: null },
  { id: "kot-shkoln", n: "Котлети «Шкільні»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Шкільні» (курка).png", price: null },
  { id: "naggets", n: "Курячі нагетси", c: "Котлети", img: "assets/img/products/cutlets/Нагетси курячі.png", price: null },
  { id: "grechaniki", n: "Гречаники", c: "Котлети", img: "assets/img/products/cutlets/Гречаники домашні (свинина + яловичина + гречка).png", price: null },
  { id: "kot-kiev-file", n: "Котлети «Київські»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Київські» (філе + масло + зелень).png", price: null },
  { id: "kordon-blu", n: "Кордон-блю", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Кордон-Блю» (філе + шинка + сир).png", price: null },
  { id: "kot-sokovit", n: "Котлети «Соковиті»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Соковиті» (яловичина + курка).png", price: null },
  { id: "kot-dom-maslo", n: "Котлети «Домашні»", c: "Котлети", img: "assets/img/products/cutlets/Котлети «Домашні» (свинина + яловичина + масло).png", price: null },
  { id: "shnic-dom", n: "Домашній шніцель", c: "Котлети", img: "assets/img/products/cutlets/Шніцель домашній (яловичина).png", price: null },
  { id: "kot-burger", n: "Котлети для бургерів", c: "Котлети", img: "assets/img/products/cutlets/Котлети для бургерів (яловичина).png", price: null },
  { id: "kot-rublen", n: "Рублені котлети", c: "Котлети", img: "assets/img/products/cutlets/Котлети рублені (свинина + яловичина + курка).png", price: null },
  { id: "golubcy", n: "Голубці", c: "Котлети", img: "assets/img/products/cutlets/Голубці (свинина + яловичина).png", price: null },
  { id: "perec-farsh", n: "Фарширований перець", c: "Котлети", img: "assets/img/products/cutlets/Перець фарширований (свинина + яловичина).png", price: null },
  { id: "pel-bogatyr", n: "Пельмені «Богатирські»", c: "Пельмені", img: "assets/img/products/dumplings/Богатирські (Яловичина + курка).png", price: null },
  { id: "pel-bulmeni", n: "Бульмені", c: "Пельмені", img: "assets/img/products/dumplings/Бульмені (Яловичина + бульйон).png", price: null },
  { id: "pel-dom", n: "Пельмені «Домашні»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Домашні» (свинина).jpg", price: null },
  { id: "pel-kozackie", n: "Пельмені «Козацькі»", c: "Пельмені", img: "assets/img/products/dumplings/Козацькі (Свинина + яловичина).png", price: null },
  { id: "pel-kurinye", n: "Пельмені «Курячі»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Курячі».jpg", price: null },
  { id: "pel-malyshki", n: "Пельмені «Малюки»", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Малюки» .png", price: null },
  { id: "pel-babush", n: "Пельмені «Бабусині»", c: "Пельмені", img: "assets/img/products/dumplings/Бабусині (Свинина + яловичина + курка).png", price: null },
  { id: "pel-vershk", n: "Пельмені «Вершкові»", c: "Пельмені", img: "assets/img/products/dumplings/Вершкові (Свинина + яловичина + вершкове масло).png", price: null },
  { id: "ravioli", n: "Равіолі", c: "Пельмені", img: "assets/img/products/dumplings/Пельмені «Равіолі» .png", price: null },
  { id: "hink-dom", n: "Хінкалі «Домашні»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Домашні» .png", price: null },
  { id: "hink-kavkaz", n: "Хінкалі «Кавказькі»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Кавказькі» (яловичина + курка + зелень + паприка + базилік).png", price: null },
  { id: "hink-shah", n: "Хінкалі «Шах»", c: "Хінкалі", img: "assets/img/products/dumplings/Хінкалі «Шах» (свинина + яловичина + зелень).png", price: null },
  { id: "smetana", n: "Фермерська сметана", c: "Молочка", img: "assets/img/products/molochka/Сметана фермерська.png", price: null },
  { id: "tvorog", n: "Домашній сир", c: "Молочка", img: "assets/img/products/molochka/Творог домашній .png", price: null },
  { id: "sirna-masa", n: "Сирна маса з родзинками", c: "Молочка", img: "assets/img/products/molochka/Сирна маса з родзинками .png", price: null },
  { id: "yaitsa", n: "Яйця фермерські", c: "Додатково", img: "assets/img/products/qw/яйця.jpg", price: null }
];

const listEl = document.getElementById("productsList");
const formMessageEl = document.getElementById("formMessage");
const newNameEl = document.getElementById("newName");
const newCategoryEl = document.getElementById("newCategory");
const newPriceEl = document.getElementById("newPrice");
const newImageEl = document.getElementById("newImage");
const addBtn = document.getElementById("addBtn");
const resetBtn = document.getElementById("resetBtn");

let products = [];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProduct(item) {
  return {
    id: item.id,
    n: item.n || item.name,
    c: item.c || item.category,
    img: item.img || item.image || "",
    price: typeof item.price === "number" ? item.price : null
  };
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    products = BASE_PRODUCTS.map(normalizeProduct);
    return;
  }
  try {
    products = JSON.parse(raw).map(normalizeProduct);
  } catch (_) {
    products = BASE_PRODUCTS.map(normalizeProduct);
  }
}

function setMessage(text) {
  formMessageEl.textContent = text;
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

    const nameInput = row.querySelector('[data-field="n"]');
    const catInput = row.querySelector('[data-field="c"]');
    const priceInput = row.querySelector('[data-field="price"]');
    const imgInput = row.querySelector('[data-field="img"]');
    const delBtn = row.querySelector('[data-action="delete"]');

    function persistRow() {
      item.n = nameInput.value.trim();
      item.c = catInput.value.trim();
      item.img = imgInput.value.trim();
      item.price = priceInput.value === "" ? null : Number(priceInput.value);
      saveProducts();
      setMessage("Зміни збережено");
    }

    nameInput.addEventListener("change", persistRow);
    catInput.addEventListener("change", persistRow);
    priceInput.addEventListener("change", persistRow);
    imgInput.addEventListener("change", persistRow);

    delBtn.addEventListener("click", () => {
      products = products.filter((p) => p.id !== item.id);
      saveProducts();
      renderProducts();
      setMessage("Товар видалено");
    });

    listEl.appendChild(row);
  });
}

addBtn.addEventListener("click", () => {
  const name = newNameEl.value.trim();
  const category = newCategoryEl.value.trim();
  const image = newImageEl.value.trim();
  const priceValue = newPriceEl.value;
  const price = priceValue === "" ? null : Number(priceValue);

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

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  products = BASE_PRODUCTS.map(normalizeProduct);
  renderProducts();
  setMessage("Список скинуто до базового");
});

loadProducts();
renderProducts();
