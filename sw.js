/* =========================================================
   Service Worker - PWA cache + SPA fallback
========================================================= */

const CACHE_VERSION = "rw-cache-v77";
const DATA_VERSION = "2026-03-16-3";
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
  const resourcePdfNames = {
    grammar: ["grammar-reference", "verb-and-sentence-guide", "grammar-quick-review"],
    vocabulary: ["everyday-vocabulary", "topic-word-list", "useful-expressions"],
    worksheets: ["grammar-worksheet", "reading-worksheet", "mixed-practice"],
    flashcards: ["daily-life-flashcards", "verbs-flashcards", "expressions-flashcards"]
  };
  const resourcePdfs = ["a1", "a2", "b1", "b2"].flatMap(level =>
    Object.entries(resourcePdfNames).flatMap(([category, names]) =>
      names.map(name => toAbsolute(`assets/pdfs/${level}/${category}/${name}.pdf`))
    )
  );
  return [
    toAbsolute(""),
    toAbsolute("index.html"),
    toAbsolute("404.html"),
    toAbsolute("manifest.webmanifest"),
    toAbsolute("css/style.css"),
    toAbsolute("css/dark.css"),
    toAbsolute("css/course-enrollment.css"),
    toAbsolute("css/library-topic.css"),
    toAbsolute("css/practice.css"),
    toAbsolute("css/download-center.css"),
    toAbsolute("css/course-module.css"),
    toAbsolute("js/app.js"),
    toAbsolute("js/ui.js"),
    toAbsolute("js/course-enrollment.js"),
    toAbsolute("js/library-topic.js"),
    toAbsolute("js/library-topic-data.js"),
    toAbsolute("js/practice.js"),
    toAbsolute("js/practice-data.js"),
    toAbsolute("js/download-center.js"),
    toAbsolute("js/auth-gate.js"),
    toAbsolute("js/course-module.js"),
    toAbsolute("js/course-module-data.js"),
    toAbsolute("js/level-page.js"),
    toAbsolute("js/words.js"),
    toAbsolute(`js/words.json?v=${DATA_VERSION}`),
    toAbsolute(`js/irregular_verbs.json?v=${DATA_VERSION}`),
    toAbsolute("js/firebase.js"),
    toAbsolute("js/auth.js"),
    toAbsolute("assets/favicon.png"),
    toAbsolute("assets/logo.png"),
    toAbsolute("assets/icon-192.png"),
    toAbsolute("assets/icon-512.png"),
    toAbsolute("pages/course-enrollment.html"),
    toAbsolute("pages/library-topic.html"),
    toAbsolute("pages/practice.html"),
    toAbsolute("pages/download-center.html"),
    toAbsolute("pages/course-module.html"),
    ...resourcePdfs
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

