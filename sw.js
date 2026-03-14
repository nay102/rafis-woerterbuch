/* =========================================================
   Service Worker - PWA cache + SPA fallback
========================================================= */

const CACHE_VERSION = "rw-cache-v5";
const DATA_VERSION = "2026-03-13-1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

function getBasePath() {
  // Examples:
  // Local: /sw.js -> /
  // GitHub Pages project: /repo/sw.js -> /repo/
  const swPath = self.location.pathname || "/sw.js";
  return swPath.replace(/sw\.js$/, "");
}

function toAbsolute(path) {
  const base = getBasePath();
  const clean = String(path || "").replace(/^\/+/, "");
  return `${base}${clean}`;
}

function coreUrls() {
  return [
    toAbsolute(""),
    toAbsolute("index.html"),
    toAbsolute("404.html"),
    toAbsolute("manifest.webmanifest"),
    toAbsolute("css/style.css"),
    toAbsolute("js/app.js"),
    toAbsolute("js/ui.js"),
    toAbsolute("js/words.js"),
    toAbsolute(`js/words.json?v=${DATA_VERSION}`),
    toAbsolute(`js/irregular_verbs.json?v=${DATA_VERSION}`),
    toAbsolute("js/firebase.js"),
    toAbsolute("js/auth.js"),
    toAbsolute("assets/favicon.png"),
    toAbsolute("assets/logo.png"),
    toAbsolute("assets/icon-192.png"),
    toAbsolute("assets/icon-512.png")
  ];
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(coreUrls())).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (!key.startsWith(CACHE_VERSION)) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(requestUrl) {
  return /\.(?:css|js|json|png|jpg|jpeg|gif|svg|webp|ico|webmanifest)$/i.test(
    requestUrl.pathname
  );
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") return;
  if (requestUrl.origin !== self.location.origin) return;

  // App navigation (including SPA routes like /owner, /category, etc.)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match(toAbsolute(""))) ||
            (await cache.match(toAbsolute("index.html"))) ||
            (await cache.match(toAbsolute("404.html")))
          );
        })
    );
    return;
  }

  // Keep dictionary JSON fresh: network-first, cache fallback.
  if (
    requestUrl.pathname.endsWith("/js/words.json") ||
    requestUrl.pathname.endsWith("/js/irregular_verbs.json")
  ) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static files: stale-while-revalidate for smoother updates.
  if (isStaticAsset(requestUrl)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(networkResponse => {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
            return networkResponse;
          })
          .catch(() => null);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: network-first with cache fallback.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

