const CACHE_NAME = 'realmscans-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  // Delete old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    // Network First strategy: try network, fallback to cache
    fetch(event.request).then((response) => {
      // Don't cache non-successful responses or non-GET requests
      if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
        return response;
      }
      
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });
      
      return response;
    }).catch(() => {
      // Fallback to cache if network fails
      return caches.match(event.request);
    })
  );
});
