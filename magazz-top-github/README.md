# Magazz Top Project

Единый основной проект для публикации на GitHub, собранный на базе лучших наработок из папки `Magazz`.

## Что сделано

- Проанализированы версии: `magaz 3.0`, `magaz4`, `magaz55`, `magazinn`, `magaz-new`, `magazin2.0/magazinn`.
- Выбрана базовая ветка для релиза: `magaz-new` (наиболее цельная структура PHP + API + SQL + каталог + админка).
- Подготовлен план сборки одного стабильного репозитория.

## Почему за основу выбран `magaz-new`

- Четкая структура сайта: `index`, `catalog`, `api`, `admin`, `sql`.
- Есть карта архитектуры (`SITE_MAP.md`) и рабочий SQL (`sql/install.sql`).
- Каталог и корзина уже собраны в одной версии.
- Проект проще привести к production-состоянию без глубокого рефакторинга.

## Рекомендованная структура будущего GitHub-репозитория

```text
magazz-top/
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── release-checklist.md
├── public/
│   ├── index.php
│   ├── cart.php
│   ├── qr.php
│   ├── assets/
│   ├── catalog/
│   └── pages/
├── app/
│   ├── api/
│   ├── admin/
│   └── includes/
└── database/
    └── install.sql
```

## Что переносить в первую очередь

1. Из `magaz-new`:
   - `index.php`, `cart.php`, `qr.php`
   - `assets/`, `catalog/`, `pages/`
   - `api/`, `admin/`, `includes/`
   - `sql/install.sql`
2. Из `magazin2.0/magazinn`:
   - удачные пункты из `README.md` (деплой, безопасность, API).
3. Из `magaz 3.0`:
   - отдельные UX-идеи (сценарии/наборы), если нужны в финальном UI.

## Быстрый старт (после переноса)

```bash
# 1) Создать новый репозиторий
mkdir magazz-top && cd magazz-top
git init

# 2) Разложить код по структуре (public/app/database)
# 3) Настроить подключение к БД в includes/config.php

# 4) Импортировать БД
mysql -u root -p < database/install.sql

# 5) Запустить локально (например, встроенный PHP сервер)
php -S localhost:8080 -t public
```

## Следующий шаг

См. файл `PROJECT_SELECTION.md` и `GITHUB_RELEASE_PLAN.md` в этой папке — там конкретные шаги для сборки и публикации.
