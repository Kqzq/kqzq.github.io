// Version du cache
const CACHE_NAME = 'greentrack-v1';
// Fichiers à mettre en cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];
// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});
// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});
// Stratégie de récupération : Network First, puis Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cloner la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = response.clone();
        
        // Mettre à jour le cache avec la nouvelle réponse
        if (response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // En cas d'échec de la requête réseau, essayer depuis le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            // Retourner le contenu du cache s'il existe
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si l'élément n'est pas dans le cache non plus, renvoyer une erreur appropriée
            // pour les requêtes de pages HTML, on peut rediriger vers une page offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');  // Vous devriez créer cette page
            }
            
            return new Response('Contenu non disponible', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});