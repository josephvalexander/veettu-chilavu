/* ═══════════════════════════════════════════════
   sw.js — Bodhanika Service Worker
   Version is injected by GitHub Actions on deploy.
   Changing VERSION forces all clients to refresh.
   ═══════════════════════════════════════════════ */

const VERSION = 'v2026.04.04.1329';
const CACHE   = 'bodhanika-' + VERSION;

/* Files to cache for offline use */
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/css/base.css',
  '/css/layout.css',
  '/css/modal.css',
  '/js/app.js',
  '/js/modal.js',
  '/js/sims.js',
  '/js/sims-3d.js',
  '/js/tips.js',
  '/js/favourites.js',
  '/js/fullscreen.js',
  '/js/data.js',
  '/js/data-1-5.js',
  '/js/data-6-10-science.js',
  '/js/data-6-10-maths.js',
  '/js/data-6-10-evs-life.js',
  '/js/data-maths-tips.js',
];

/* ── Install: cache all files ── */
self.addEventListener('install', function(e) {
  self.skipWaiting(); /* activate immediately */
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
});

/* ── Activate: delete old caches, claim clients ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: network first for JS/CSS, cache fallback ── */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  var url = e.request.url;
  var isAsset = url.match(/\.(js|css|svg|png|json)$/);

  if (isAsset) {
    /* Cache-first for versioned assets — SW version bump clears old cache */
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
          }
          return response;
        });
      })
    );
  } else {
    /* Network-first for HTML navigation */
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request) || caches.match('/index.html');
      })
    );
  }
});

/* ── Message: force skip waiting ── */
self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
