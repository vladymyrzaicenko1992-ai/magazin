const FALLBACK_IMAGE = "assets/img/products/dumplings/Богатирські (Яловичина + курка).webp";
const CATEGORY_IMAGES = {
  "Вареники": "assets/img/products/vareniki/Вареники з картоплею.webp",
  "Млинці": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).webp",
  "Котлети": "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).webp",
  "Пельмені": "assets/img/products/dumplings/Богатирські (Яловичина + курка).webp",
  "Хінкалі": "assets/img/products/dumplings/Хінкалі «Домашні» .webp",
  "Молочка": "assets/img/products/molochka/Сметана фермерська.webp",
  "Додатково": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.webp",
  "Бакалія": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.webp",
  "Вода та напої": "assets/img/products/molochka/Сметана фермерська.webp",
  "Чай та кава": "assets/img/products/molochka/Сметана фермерська.webp",
  "Консервація та соуси": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.webp"
};
const PRODUCT_IMAGES = {
  "var-kartoshka": "assets/img/products/vareniki/Вареники з картоплею.webp",
  "var-kapusta": "assets/img/products/vareniki/Вареники з капустою.webp",
  "var-serdce-pechen": "assets/img/products/vareniki/Вареники з серцем-печінкою.webp",
  "var-myaso-chesnok": "assets/img/products/vareniki/Вареники з м'ясом та часником.webp",
  "var-tvorog-sladkiy": "assets/img/products/vareniki/Вареники з солодким творогом.webp",
  "bl-myaso-dom": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).webp",
  "bl-tvorog-dom": "assets/img/products/bliny/Блинчики (з м'ясом, творогом).webp",
  "bend-myaso": "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).webp",
  "bend-kapusta": "assets/img/products/bliny/Бендерки (м'ясо, капуста свіжа та тушкована).webp",
  "cheb-myaso-syr": "assets/img/products/bliny/Чебуреки (з м'ясом та сиром).webp",
  "syrniki-zhar": "assets/img/products/bliny/Сирники смажені.webp",
  "zrazy-myas-kap": "assets/img/products/vareniki/Зрази смажені (з м'ясом , капустою).webp",
  "sosiska-v-teste": "assets/img/products/bliny/Сосиска в тісті.webp",
  "gnizdechka-myaso": "assets/img/products/bliny/Гніздечка з м'ясом.webp",
  "ovoshi-zamorozh": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.webp",
  "kartoplya-fri": "assets/img/products/bliny/Заморожені овочі, Картопля фрі.webp",
  "kot-babush": "assets/img/products/cutlets/Котлети «Бабусині» (свинина + яловичина).webp",
  "kot-yozhik": "assets/img/products/cutlets/Котлети «Їжачок» (курка).webp",
  "kot-syr": "assets/img/products/cutlets/Котлети «З сиром» (яловичина + сир).webp",
  "kot-po-kiev-farsh": "assets/img/products/cutlets/Котлети «По-київськи» (курячий фарш + масло + зелень).webp",
  "kot-sviny": "assets/img/products/cutlets/Котлети зі свинини.webp",
  "kot-shkoln": "assets/img/products/cutlets/Котлети «Шкільні» (курка).webp",
  "naggets": "assets/img/products/cutlets/Нагетси курячі.webp",
  "grechaniki": "assets/img/products/cutlets/Гречаники домашні (свинина + яловичина + гречка).webp",
  "kot-kiev-file": "assets/img/products/cutlets/Котлети «Київські» (філе + масло + зелень).webp",
  "kordon-blu": "assets/img/products/cutlets/Котлети «Кордон-Блю» (філе + шинка + сир).webp",
  "kot-sokovit": "assets/img/products/cutlets/Котлети «Соковиті» (яловичина + курка).webp",
  "kot-dom-maslo": "assets/img/products/cutlets/Котлети «Домашні» (свинина + яловичина + масло).webp",
  "shnic-dom": "assets/img/products/cutlets/Шніцель домашній (яловичина).webp",
  "kot-burger": "assets/img/products/cutlets/Котлети для бургерів (яловичина).webp",
  "kot-rublen": "assets/img/products/cutlets/Котлети рублені (свинина + яловичина + курка).webp",
  "golubcy": "assets/img/products/cutlets/Голубці (свинина + яловичина).webp",
  "perec-farsh": "assets/img/products/cutlets/Перець фарширований (свинина + яловичина).webp",
  "pel-bogatyr": "assets/img/products/dumplings/Богатирські (Яловичина + курка).webp",
  "pel-bulmeni": "assets/img/products/dumplings/Бульмені (Яловичина + бульйон).webp",
  "pel-dom": "assets/img/products/dumplings/Пельмені «Домашні» (свинина).webp",
  "pel-kozackie": "assets/img/products/dumplings/Козацькі (Свинина + яловичина).webp",
  "pel-kurinye": "assets/img/products/dumplings/Пельмені «Курячі».webp",
  "pel-malyshki": "assets/img/products/dumplings/Пельмені «Малюки» .webp",
  "pel-babush": "assets/img/products/dumplings/Бабусині (Свинина + яловичина + курка).webp",
  "pel-vershk": "assets/img/products/dumplings/Вершкові (Свинина + яловичина + вершкове масло).webp",
  "ravioli": "assets/img/products/dumplings/Пельмені «Равіолі» .webp",
  "hink-dom": "assets/img/products/dumplings/Хінкалі «Домашні» .webp",
  "hink-kavkaz": "assets/img/products/dumplings/Хінкалі «Кавказькі» (яловичина + курка + зелень + паприка + базилік).webp",
  "hink-shah": "assets/img/products/dumplings/Хінкалі «Шах» (свинина + яловичина + зелень).webp",
  "smetana": "assets/img/products/molochka/Сметана фермерська.webp",
  "tvorog": "assets/img/products/molochka/Творог домашній .webp",
  "sirna-masa": "assets/img/products/molochka/Сирна маса з родзинками .webp",
  "yaitsa": "assets/img/products/qw/яйця.webp"
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
    elements.grid.innerHTML = `<p class="muted">Нічого не знайдено. Спробуйте інший запит.</p>`;
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
  const order = ["Пельмені", "Хінкалі", "Вареники", "Млинці", "Котлети", "Молочка", "Додатково", "Вода та напої", "Бакалія", "Чай та кава", "Консервація та соуси"];
  return order
    .filter((category) => items.some((item) => item.category === category))
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    }));
}
