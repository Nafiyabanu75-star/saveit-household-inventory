
const CACHE_NAME = "saveit-cache-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(cacheName) {
                        return cacheName.startsWith("saveit-cache-") &&
                               cacheName !== CACHE_NAME;
                    })
                    .map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});
