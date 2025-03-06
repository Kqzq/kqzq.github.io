self.addEventListener("install", event => {
    console.log("Service Worker installé !");
    event.waitUntil(
        caches.open("greentrack-cache").then(cache => {
            return cache.addAll([
                "index.html",
                "app.js",
                "styles.css",
                "manifest.json",
                "service-worker.js",
                "icons/icon-192x192.png",
                "icons/icon-512x512.png",
            ]);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
