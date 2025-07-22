const CACHE_NAME = "inventory-pos-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./inventory.html",
  "./inventory.js",
  "./browse.js",
  "./BrowseProducts.html",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});