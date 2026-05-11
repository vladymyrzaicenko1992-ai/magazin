# GitHub Release Plan (Static)

Checklist for publishing the static `magazz-top` app to GitHub Pages.

## 1) Pre-publish checks

- Confirm `index.html` is in repo root.
- Confirm `assets/css/style.css`, `assets/js/app.js`, `assets/data/products.json` exist.
- Open site locally and verify:
  - product rendering,
  - search/filter,
  - bookmark add/remove,
  - bookmarks persist after page reload,
  - QR dialog opens and shows code.

## 2) Content checks

- Replace placeholder product images if needed.
- Confirm store address and map in `index.html`.
- Confirm product categories in `assets/data/products.json`.

## 3) Git steps

```bash
git init
git add .
git commit -m "Initial static release for GitHub Pages"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 4) Enable Pages

- GitHub -> `Settings` -> `Pages`
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## 5) Done criteria

- Public URL opens without backend.
- Core user flow works on mobile:
  - open menu,
  - bookmark products,
  - return later and still see bookmarks.
