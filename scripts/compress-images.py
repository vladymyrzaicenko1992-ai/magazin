#!/usr/bin/env python3
"""Сжать все PNG/JPG картинки товаров в WebP: max 800px ширина, quality 80."""

import os
import json
from pathlib import Path
from PIL import Image

PRODUCTS_DIR = Path("assets/img/products")
MAX_WIDTH = 800
QUALITY = 80

def compress_image(src_path: Path) -> Path | None:
    """Конвертирует src_path в .webp с изменением размера. Возвращает путь к webp."""
    dst = src_path.with_suffix(".webp")
    try:
        img = Image.open(src_path).convert("RGB")
        w, h = img.size
        if w > MAX_WIDTH:
            ratio = MAX_WIDTH / w
            img = img.resize((MAX_WIDTH, int(h * ratio)), Image.LANCZOS)
        img.save(dst, "webp", quality=QUALITY)
        src_size = os.path.getsize(src_path)
        dst_size = os.path.getsize(dst)
        saved = 100 * (1 - dst_size / src_size) if src_size else 0
        print(f"  {src_path.name}: {src_size//1024}KB -> {dst_size//1024}KB ({saved:.0f}%)")
        return dst
    except Exception as e:
        print(f"  {src_path.name}: ERROR {e}")
        return None

def update_json(products_file: Path):
    """Меняет .png/.jpg на .webp в products.json."""
    with open(products_file) as f:
        data = json.load(f)
    changed = 0
    for item in data:
        img = item.get("image", "")
        if img and (img.endswith(".png") or img.endswith(".jpg")):
            item["image"] = img[:img.rfind(".")] + ".webp"
            changed += 1
    with open(products_file, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"  products.json: {changed} ссылок обновлено на .webp")

def update_js(js_file: Path):
    """Меняет .png/.jpg на .webp в JS-файлах (PRODUCT_IMAGES, CATEGORY_IMAGES, FALLBACK_IMAGE)."""
    txt = js_file.read_text()
    changed = 0
    for ext in (".png", ".jpg"):
        old_ext = ext
        new_ext = ".webp"
        for variant in (old_ext + '"', old_ext + "'"):
            old = variant
            new = new_ext + variant[-1]
            if old in txt:
                txt = txt.replace(old, new)
                changed += txt.count(old)
    js_file.write_text(txt)
    print(f"  {js_file.name}: ссылок обновлено на .webp")

def main():
    base = Path(__file__).parent.parent  # repo root
    os.chdir(base)
    print("Сжатие картинок...")
    total_before = 0
    total_after = 0

    for src in sorted(PRODUCTS_DIR.rglob("*.png")) + sorted(PRODUCTS_DIR.rglob("*.jpg")):
        total_before += os.path.getsize(src)
        dst = compress_image(src)
        if dst:
            total_after += os.path.getsize(dst)

    print(f"\nДо: {total_before//1024//1024} MB, После: {total_after//1024//1024} MB ({(1-total_after/total_before)*100:.0f}% меньше)")

    print("\nОбновление ссылок...")
    update_json(Path("assets/data/products.json"))
    update_js(Path("assets/js/app.js"))
    update_js(Path("assets/js/store-meta.js"))
    print("\nГотово!")

if __name__ == "__main__":
    main()
