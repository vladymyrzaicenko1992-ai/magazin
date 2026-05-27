# Telegram-замовлення

**Бот:** [@Magazine1304_bot](https://t.me/Magazine1304_bot)  
**Група:** [Заказы](https://t.me/+Oqqf9ywZPIs2ZDhi)  
**CHAT_ID групи:** `-1003933471474` (вже налаштовано на сервері)

## Як працює зараз

```
Сайт (кошик) → HTTPS API на сервері → Telegram-група «Заказы»
```

URL API (у `assets/data/config.json`):

`https://161-35-146-240.nip.io/order.php`

Токен бота і chat_id зберігаються **лише на сервері** у `/var/www/magazin-order/config.php` (не в GitHub).

## Перевірка

1. Відкрийте [кошик](https://vse-v-morozilke.shop/cart.html).
2. Додайте товар, вкажіть ім’я та телефон.
3. Натисніть **Оформити замовлення**.
4. У групі Telegram має з’явитися **🛒 НОВЕ ЗАМОВЛЕННЯ**.

## Google Apps Script (каталог + опційно замовлення)

Каталог товарів як і раніше — через Google Таблицю (`googleWebAppUrl`).

Щоб замовлення йшли **через Apps Script** замість сервера:

1. Вставте код з `scripts/google-apps-script.gs` у редактор таблиці.
2. **Проект → Налаштування → Властивості скрипта:**
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID` = `-1003933471474`
3. **Розгорнути → Нове розгортання → Веб-додаток** (доступ: Усі).
4. У `config.json` приберіть `orderApiUrl` (залишиться лише `googleWebAppUrl`).

### Дізнатися CHAT_ID вручну

1. Напишіть у групі будь-яке повідомлення.
2. Відкрийте (підставте токен від @BotFather):

   `https://api.telegram.org/bot<TOKEN>/getUpdates`

3. Знайдіть `"chat":{"id":-100...}`.

Або після налаштування Script Properties:

`https://script.google.com/.../exec?action=chats`

## PHP на своєму домені (опційно)

1. `api/config.example.php` → `api/config.php` на сервері з PHP.
2. У `config.json`: `"orderApiUrl": "https://ваш-домен/api/order.php"`.

## Безпека

- Не публікуйте токен бота в GitHub.
- Якщо токен потрапив у чат — `/revoke` у @BotFather і оновіть `config.php` на сервері.
