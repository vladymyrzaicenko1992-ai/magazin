# Project Selection Notes

This document explains why the final repository is now a static app.

## Why static architecture was selected

- GitHub Pages does not run server-side code.
- The project goal requires "works forever" hosting with minimal maintenance.
- LocalStorage preserves user bookmarks on the same device without sign-in.
- Product content can be managed in JSON instead of a database.

## What was kept from previous iterations

- Product/menu concept.
- Category browsing and quick search.
- QR-first entry flow.
- Strong visual identity and mobile emphasis.

## What changed in final version

- Server-dependent logic replaced with client-side rendering.
- Single entry page: `index.html`.
- Data source: `assets/data/products.json`.
- Persistent "My Bookmarks": browser LocalStorage.

## Current target

`magazz-top` is optimized for:
- free hosting on GitHub Pages,
- fast loading on mobile,
- simple non-technical content updates.
