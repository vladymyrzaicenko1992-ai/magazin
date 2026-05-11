# Magazin

Static mobile-first menu app for GitHub Pages.  
Works fully client-side with `HTML + CSS + JavaScript + LocalStorage`.

---

## RU

### Что это

`Magazin` — молодежная витрина с акцентом на:
- полное меню по категориям;
- кнопку **"Добавить в мои закладки"**;
- сохранение закладок на устройстве без регистрации;
- QR для быстрого входа на сайт;
- локальные фото товаров из проекта.

### Технологии

- `index.html` — единая точка входа
- `assets/data/products.json` — данные товаров
- `assets/js/app.js` — логика фильтрации, вкладок, QR, LocalStorage
- `assets/css/style.css` — mobile-first UI

### Структура

```text
magazz-top/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/app.js
│   └── data/products.json
├── docs/
├── .gitignore
├── LICENSE
└── README.md
```

### Как добавить новый товар

1. Открой `assets/data/products.json`.
2. Добавь объект в массив (без цены и состава):

```json
{
  "id": "unique-id",
  "name": "Пельмени с сыром",
  "category": "Пельмени"
}
```

3. Сохрани файл и закоммить изменения.

### Как изменить адрес магазина

1. В `index.html` обнови блок контактов в секции `Где мы?`.
2. Обнови ссылку `https://maps.google.com/?q=...`.
3. Обнови `iframe` карты в той же секции.

### Локальный запуск

Можно открыть `index.html` напрямую в браузере.  
Для корректного `fetch` JSON лучше запускать через простой статический сервер:

```bash
python3 -m http.server 8080
```

Открой: [http://localhost:8080](http://localhost:8080)

### Деплой на GitHub Pages

1. Залей проект в репозиторий.
2. В GitHub: `Settings -> Pages`.
3. Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Готово: `https://username.github.io/magazz-top/`.

---

## EN

### Overview

`Magazin` is a youth-focused static menu web app with:
- full category-based menu cards;
- **"Add to my bookmarks"** flow instead of checkout;
- persistent bookmarks via LocalStorage;
- QR entry point for offline-to-online traffic;
- local product photos from the repository.

### Stack

- `index.html` as a single entry point
- `assets/data/products.json` as a data source
- `assets/js/app.js` for all client-side logic
- `assets/css/style.css` for responsive UI

### Add a new product

Edit `assets/data/products.json` and append a new object:

```json
{
  "id": "unique-id",
  "name": "Cheese Dumplings",
  "category": "Dumplings"
}
```

### Change store address

Update the contacts section in `index.html`:
- address text,
- Google Maps link,
- embedded map `iframe` coordinates.

### Local run

```bash
python3 -m http.server 8080
```

Open: [http://localhost:8080](http://localhost:8080)

### GitHub Pages deployment

1. Push to GitHub.
2. Go to `Settings -> Pages`.
3. Select `Deploy from a branch`, `main`, `/ (root)`.
4. Visit `https://username.github.io/magazz-top/`.
