const CACHE_NAME = 'cucquy-offline-v1';
const OFFLINE_URL = './offline.html';

self.addEventListener('install', (event) => {
  // Perform install steps: Cache the offline page
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We explicitly fetch and cache the offline page
      return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tell the active service worker to take control of the page immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle navigation requests (i.e., when the user goes to a page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network request fails, return the offline page from cache
        return caches.match(OFFLINE_URL);
      })
    );
  }
  // For all other requests (images, api calls, etc.), do nothing and let the browser handle it.
  // If offline, these will simply fail, which is expected behavior for "no cache" strategy.
});