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

const state = { products: [], query: "" };

const elements = {
  grid: document.getElementById("productsGrid"),
  searchInput: document.getElementById("searchInput")
};

init();

async function init() {
  await loadProducts();
  renderProducts();
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
}

function renderProducts() {
  const filtered = state.products.filter((item) => {
    const byQuery = item.name.toLowerCase().includes(state.query);
    return byQuery;
  });

  if (filtered.length === 0) {
    elements.grid.innerHTML = `<p class="muted">Ничего не найдено. Попробуй другой запрос.</p>`;
    return;
  }

  const grouped = groupByCategory(filtered);
  elements.grid.innerHTML = grouped
    .map(({ category, items }) => {
      const cards = items.map((item) => {
      return `
        <article class="product-card">
          <img src="${encodeURI(getImageForProduct(item))}" alt="${item.name}" loading="lazy" onerror="this.src='${encodeURI(FALLBACK_IMAGE)}'">
          <div class="product-body">
            <h3>${item.name}</h3>
            <div class="product-meta">
              <span>${item.category}</span>
            </div>
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
}

function getImageForProduct(item) {
  return PRODUCT_IMAGES[item.id] || item.image || CATEGORY_IMAGES[item.category] || FALLBACK_IMAGE;
}

function groupByCategory(items) {
  const order = ["Пельмени", "Хинкали", "Вареники", "Блинчики", "Котлеты", "Молочка", "Дополнительно"];
  return order
    .filter((category) => items.some((item) => item.category === category))
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    }));
}
