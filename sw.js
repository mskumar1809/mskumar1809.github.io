const CACHE = 'cricket-chronicles-v12';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/styles.css',
  './js/storage.js', './js/sync.js', './js/voice.js', './js/media.js', './js/mascot.js', './js/mentor.js', './js/onboarding.js', './js/coach.js', './js/matches.js',
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

// Navigations (page loads): network-first so updates apply on the FIRST
// relaunch; everything else cache-first for instant offline loads.
self.addEventListener('fetch', e => {
  const isNavigation = e.request.mode === 'navigate' ||
    (e.request.destination === 'document' || e.request.destination === '');
  if (isNavigation && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }
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
