const CACHE_NAME = 'jac-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/reunion.html',
  '/css/style.css',
  '/js/supabase.js',
  '/js/db.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

function isApiRequest(url) {
  return url.includes('supabase.co') || url.includes('rest/v1/');
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(function (path) { return url.endsWith(path); }) ||
    url.includes('/icons/') ||
    url.endsWith('.css') || url.endsWith('.js') ||
    url.endsWith('.json') || url.endsWith('.png') ||
    url.endsWith('.jpg') || url.endsWith('.svg');
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function (err) {
        console.warn('SW: some assets failed to cache', err);
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API requests: network only (no cache)
  if (isApiRequest(url)) {
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return cached || fetch(event.request).then(function (response) {
          return caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Everything else (HTML pages, etc.): network-first
  event.respondWith(
    fetch(event.request).then(function (response) {
      return caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(function () {
      return caches.match(event.request);
    })
  );
});
