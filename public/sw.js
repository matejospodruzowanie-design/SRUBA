// ŚRUBA Service Worker v2 — full offline support
const CACHE_VERSION = 'sruba-v2';
const STATIC_CACHE = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

// All app routes to pre-cache on install — these are the shell pages
const PRECACHE_ROUTES = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/workout',
  '/history',
  '/exercises',
  '/plans',
  '/progress',
  '/profile',
  '/challenges',
  '/coach',
  '/manifest.json',
];

// ─── Install: pre-cache all shell routes ───

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Pre-cache all routes
      const precacheRequests = PRECACHE_ROUTES.map((route) => {
        return cache.add(route).catch((err) => {
          console.warn('[SW] Failed to pre-cache:', route, err.message);
        });
      });
      return Promise.all(precacheRequests);
    }).then(() => {
      // Notify clients that install is complete
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_INSTALLED' });
        });
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ───

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((n) => n !== STATIC_CACHE && n !== RUNTIME_CACHE)
          .map((n) => caches.delete(n))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// ─── Fetch strategy ───

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip API routes (always network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip Next.js hot reload and dev tools
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('turbopack')
  ) {
    return;
  }

  // HTML navigation: network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Ultimate fallback: return the dashboard from cache
          const fallback = await caches.match('/dashboard');
          return fallback || new Response('Offline — wróć do dashboardu', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Return nothing for failed static asset loads
        return new Response('', { status: 408 });
      });
    })
  );
});

// ─── Messages from the app ───

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_ALL') {
    // App requests full pre-cache (called after install)
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return Promise.all(
          PRECACHE_ROUTES.map((route) =>
            cache.add(route).catch(() => {})
          )
        );
      })
    );
  }

  if (event.data?.type === 'CACHE_URL') {
    // Cache a specific URL
    const urlToCache = event.data.url;
    if (urlToCache) {
      event.waitUntil(
        caches.open(RUNTIME_CACHE).then((cache) =>
          cache.add(urlToCache).catch(() => {})
        )
      );
    }
  }
});
