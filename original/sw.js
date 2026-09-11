const CACHE_NAME = 'dna-pub-v1.3.0-shell';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;800&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async asset => {
      try { await cache.add(asset); } catch (_) { /* CDN บางแห่งอาจปฏิเสธ cache ข้ามโดเมน */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return caches.match('./index.html');
    }
  })());
});
