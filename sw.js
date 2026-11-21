/* Sport Pro â€“ Offline-Cache (nur lokale Dateien) */
const CACHE = 'sport-pro-v28';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './js/env.example.js',
  './js/util.js',
  './js/store.js',
  './js/ui.js',
  './js/supabase.js',
  './js/cloud.js',
  './js/dashboard.js',
  './js/recipes.js',
  './js/nutrition.js',
  './js/exercises.js',
  './js/plans.js',
  './js/log.js',
  './js/counters.js',
  './js/settings.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
