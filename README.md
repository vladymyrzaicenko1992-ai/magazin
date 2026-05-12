# Magazin

Статичний мобільний каталог для GitHub Pages.  
Працює повністю на клієнті: `HTML + CSS + JavaScript + LocalStorage`.

---

## UA

### Що це

`Magazin` — вітрина меню з акцентом на:
- повне меню за категоріями;
- кнопку **«Додати до моїх закладок»**;
- збереження закладок на пристрої без реєстрації;
- QR для швидкого переходу на сайт;
- локальні фото товарів з репозиторію.

### Технології

- `index.html` — єдина точка входу
- `assets/data/products.json` — дані товарів
- `assets/js/app.js` — логіка фільтрації, вкладок, QR, LocalStorage
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

### Як додати новий товар

1. Відкрий `assets/data/products.json`.
2. Додай об’єкт у масив (без ціни й складу):

```json
{
  "id": "unique-id",
  "name": "Пельмені з сиром",
  "category": "Пельмені"
}
```

3. Збережи файл і закоміть зміни.

### Як змінити адресу магазину

1. У `index.html` онови блок контактів у секції з адресою.
2. Онови посилання `https://maps.google.com/?q=...`.
3. За потреби онови `iframe` карти в тій самій секції.

### Локальний запуск

Можна відкрити `index.html` безпосередньо в браузері.  
Для коректного `fetch` JSON краще запускати через простий статичний сервер:

```bash
python3 -m http.server 8080
```

Відкрий: [http://localhost:8080](http://localhost:8080)

### Деплой на GitHub Pages

1. Завантаж проєкт у репозиторій.
2. У GitHub: `Settings -> Pages`.
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
