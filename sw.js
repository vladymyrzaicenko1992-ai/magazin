// Service worker магазина.
// ВАЖНО: код, стили и данные каталога НЕЛЬЗЯ отдавать cache-first — иначе
// покупатель со старой версией видит старые цены и старый JS после обновления.
// js|css|json — network-first, кэш только как офлайн-фолбэк.
// Картинки/шрифты — cache-first (меняются редко).
const CACHE = "magazin-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(["/index.html", "/cart.html", "/assets/img/hero-storefront.webp"]).catch(() => {})
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Картинки и шрифты — можно из кэша
  if (url.pathname.match(/\.(png|jpe?g|webp|svg|gif|ico|woff2?)$/i)) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // JS / CSS / JSON (каталог, config, цены) — сначала сеть
  if (url.pathname.match(/\.(js|css|json)$/i)) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Страницы — сначала сеть
  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(networkFirst(e.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const net = await fetch(request);
    if (net.ok) (await caches.open(CACHE)).put(request, net.clone());
    return net;
  } catch (_) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const net = await fetch(request, { cache: "no-store" });
    if (net.ok) (await caches.open(CACHE)).put(request, net.clone());
    return net;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}
