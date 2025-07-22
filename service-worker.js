self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  self.clients.claim(); // Become available to all pages
});

self.addEventListener("fetch", (event) => {
  // Simple pass-through handler for now
  event.respondWith(fetch(event.request).catch(() => {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }));
});