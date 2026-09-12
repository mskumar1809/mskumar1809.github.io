const CACHE = 'cricket-chronicles-v10';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/styles.css',
  './js/storage.js', './js/sync.js', './js/voice.js', './js/media.js', './js/mascot.js', './js/mentor.js', './js/onboarding.js', './js/coach.js',
  './js/gamification.js', './js/wizard.js',
  './js/views.js', './js/app.js', './js/charts.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Offline-first: serve from cache, fall back to network for freshness.
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
