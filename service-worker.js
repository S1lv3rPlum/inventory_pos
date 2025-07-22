const CACHE_NAME = "inventory-pos-cache-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./inventory.html",
  "./inventory.js",
  "./BrowseProducts.html",
  "./browse.js",
  "./backup.js",
  "./colortheme.js",
  "./menu-overlay.js",
  "./payment.js",
  "./POS.html",
  "./pos.js",
  "./sales.html",
  "./sales.js",
  "./Settings.html",
  "./ShippingManager.html",
  "./ShippingManager.js"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request).catch(() => caches.match("./")))
  );
});