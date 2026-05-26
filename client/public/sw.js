const CACHE_NAME = 'whisperwall-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/manifest.json',
  '/icons/icon.svg'
];

// Install event - Cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Serve assets or cache dynamically
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass socket.io and API endpoints (always hit network)
  if (requestUrl.pathname.startsWith('/socket.io') || requestUrl.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, fetch fresh in background if not an image
        if (!event.request.url.match(/\.(png|jpg|jpeg|gif|webp)/)) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Ignore background sync failures */});
        }
        return cachedResponse;
      }

      // Dynamic caching for image uploads and Unsplash wallpapers
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !event.request.url.includes('unsplash.com')) {
          return networkResponse;
        }

        // Cache Unsplash images and local uploaded images dynamically
        const isImage = event.request.url.match(/\.(png|jpg|jpeg|gif|webp)/) || event.request.url.includes('unsplash.com');
        if (isImage) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Fallback for offline images
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp)/)) {
          // If we have a cached version of this request, return it
          return caches.match(event.request);
        }
      });
    })
  );
});
