const CACHE_NAME = "my-cache-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",

  "./POS.html",
  "./pos.js",
  "./inventory.html",
  "./inventory.js",
  "./BrowseProducts.html",
  "./browse.js",
  "./backup.js",
  "./colortheme.js",
  "./menu-overlay.js",
  "./payment.js",
  "./sales.html",
  "./sales.js",
  "./Settings.html",
  "./ShippingManager.html",
  "./ShippingManager.js",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install event - caching assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activate new SW immediately
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of open pages
});

// Fetch event - serve from cache first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // Optional: fallback to index.html if offline
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        })
      );
    })
  );
});