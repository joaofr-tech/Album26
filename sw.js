const CACHE_NAME = "fifa-world-cup-26-v10";
const APP_SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./src/styles.css",
  "./src/data/album.json",
  "./src/js/app.js",
  "./src/js/collection.js",
  "./src/js/export.js",
  "./src/js/match-list.js",
  "./src/js/parser.js",
  "./src/js/storage.js",
  "./src/js/structured-list.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response.redirected ? fetch(response.url) : response)
        .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => fetch(event.request)
      .then((response) => {
        if (response.ok && !response.redirected && response.type === "basic") {
          event.waitUntil(cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => cache.match(event.request).then((cached) => cached || Response.error())))
  );
});
