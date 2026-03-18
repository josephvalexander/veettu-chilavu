// ─────────────────────────────────────────────────────────
//  FamilyLedger Service Worker
//  VERSION and BUILD_TIME are injected by GitHub Actions.
//  Do NOT edit these lines manually.
// ─────────────────────────────────────────────────────────
const VERSION    = '__SW_VERSION__';   // replaced by CI → e.g. "v1.0.0-20250318T1430"
const BUILD_TIME = '__BUILD_TIME__';   // replaced by CI → ISO timestamp
const CACHE_NAME = `veettu-chilavu-${VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── INSTALL: cache core assets ──────────────────────────
// Uses Promise.allSettled so a missing file (e.g. icons not yet
// uploaded) does NOT crash the entire SW install.
self.addEventListener('install', event => {
  console.log('[SW] Installing ' + CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Skipping missing asset ' + url + ':', err.message)
          )
        )
      )
    ).then(() => {
      console.log('[SW] Install complete');
      self.skipWaiting();
    })
  );
});

// ── ACTIVATE: delete all old caches ────────────────────
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_NAME}, purging old caches`);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => (k.startsWith('veettu-chilavu-') || k.startsWith('familyledger-')) && k !== CACHE_NAME)
          .map(k => {
            console.log(`[SW] Deleting old cache: ${k}`);
            return caches.delete(k);
          })
      ))
      .then(() => {
        // Take control of all open clients immediately
        self.clients.claim();
        // Notify all open tabs that a new version is live
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: VERSION,
              buildTime: BUILD_TIME,
            });
          });
        });
      })
  );
});

// ── FETCH: network-first for APIs, cache-first for assets ─
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go straight to network for Google APIs — never cache auth tokens
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('google.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // For font CDNs: network first, fall back to cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell (HTML, JS, manifest): network-first so updates land immediately
  if (CORE_ASSETS.some(a => url.pathname === a || url.pathname.endsWith(a.replace('/', '')))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── MESSAGE: manual skipWaiting trigger from app ────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
