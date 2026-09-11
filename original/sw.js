const APP_VERSION = '1.3.2';
const CACHE_NAME = `dna-pub-v${APP_VERSION}-shell`;
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
      try { await cache.add(asset); } catch (_) { /* เก็บเท่าที่ CDN อนุญาต */ }
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
  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  event.respondWith((async () => {
    // หน้า HTML ใช้ network-first เพื่อให้มือถือเห็นเวอร์ชันใหม่ทันทีเมื่อมีเน็ต
    if (isNavigation) {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', fresh.clone());
          return fresh;
        }
      } catch (_) { /* ออฟไลน์: ใช้สำเนาใน cache */ }
      return (await caches.match('./index.html')) || (await caches.match('./'));
    }

    // ไลบรารีและไฟล์ประกอบใช้ cache-first เพื่อทำงานออฟไลน์
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return caches.match('./index.html');
    }
  })());
});
