// Service worker SIAGA KALBAR-1
// Tujuan: memenuhi syarat "installable" (Add to Home Screen) di Chrome/Android/iOS,
// serta caching ringan agar shell aplikasi tetap terbuka saat koneksi lambat/putus.
// Data tetap selalu diambil online dari Google Sheets/Apps Script (tidak di-cache).

const CACHE_NAME = 'siaga-kalbar1-v1';
const APP_SHELL = [
  './dashboard.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Jangan cache request ke Google Apps Script / Google Sheets / API pihak ketiga.
  // Data harus selalu real-time dari server.
  if (req.method !== 'GET' || req.url.includes('script.google.com') || req.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
