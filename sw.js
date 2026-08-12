/* =========================================================
   Service Worker - PWA cache + SPA fallback
========================================================= */

const CACHE_VERSION = "rw-cache-v103";
const DATA_VERSION = "2026-03-16-3-conjugation-2026-08-02-1";
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

function optionalUrls() {
  const resourcePdfNames = {
    grammar: ["grammar-reference", "verb-and-sentence-guide", "grammar-quick-review"],
    vocabulary: ["everyday-vocabulary", "topic-word-list", "useful-expressions"],
    worksheets: ["grammar-worksheet", "reading-worksheet", "mixed-practice"],
    flashcards: ["daily-life-flashcards", "verbs-flashcards", "expressions-flashcards"]
  };
  return ["a1", "a2", "b1", "b2"].flatMap(level =>
    Object.entries(resourcePdfNames).flatMap(([category, names]) =>
      names.map(name => toAbsolute(`assets/pdfs/${level}/${category}/${name}.pdf`))
    )
  );
}

function coreUrls() {
  return [
    toAbsolute(""),
    toAbsolute("index.html"),
    toAbsolute("404.html"),
    toAbsolute("manifest.webmanifest"),
    toAbsolute("css/style.css"),
    toAbsolute("css/dark.css"),
    toAbsolute("css/rafi-tutor.css"),
    toAbsolute("css/course-enrollment.css"),
    toAbsolute("css/library-topic.css"),
    toAbsolute("css/practice.css"),
    toAbsolute("css/download-center.css"),
    toAbsolute("css/course-module.css"),
    toAbsolute("css/a1.css"),
    toAbsolute("js/app.js"),
    toAbsolute("js/ui.js"),
    toAbsolute("js/rafi-tutor.js"),
    toAbsolute("js/tutor-grammar.js"),
    toAbsolute("js/tutor-exercises.js"),
    toAbsolute("js/tutor-sentences.js"),
    toAbsolute("js/data-quality.js"),
    toAbsolute("js/auth-client.js"),
    toAbsolute("js/conjugation.js"),
    toAbsolute("js/level-interactions.js"),
    toAbsolute("js/a1.js"),
    toAbsolute("js/a2.js"),
    toAbsolute("js/b1.js"),
    toAbsolute("js/b2.js"),
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
    toAbsolute("assets/branding/favicon.png"),
    toAbsolute("assets/branding/logo.png"),
    toAbsolute("assets/icons/icon-192.png"),
    toAbsolute("assets/icons/icon-512.png"),
    toAbsolute("assets/icons/icon-launch-192.png"),
    toAbsolute("assets/icons/icon-launch-512.png"),
    toAbsolute("assets/vendor/css/poppins.css"),
    toAbsolute("assets/vendor/css/fontawesome.min.css"),
    ...[
      "poppins-400.woff2", "poppins-500.woff2", "poppins-600.woff2",
      "poppins-700.woff2", "poppins-800.woff2", "fa-solid-900.woff2",
      "fa-regular-400.woff2", "fa-brands-400.woff2", "fa-v4compatibility.woff2"
    ].map(name => toAbsolute(`assets/vendor/webfonts/${name}`)),
    ...[
      "panel-ausbildung.jpg", "panel-bangladesh.jpg", "panel-germany.jpg",
      "panel-exam-zone.jpg", "panel-pro-tools.jpg", "panel-settings.jpg",
      "germany-hero.jpg", "germany-city.jpg", "germany-culture.jpg",
      "germany-history.jpg", "germany-education.jpg", "germany-work.jpg",
      "germany-language.jpg", "germany-spoken.jpg", "germany-food.jpg",
      "germany-sightseeing.jpg", "germany-religion.jpg", "germany-companies.jpg"
    ].map(name => toAbsolute(`assets/offline/${name}`)),
    toAbsolute("assets/branding/rafis-sprachwelt.png"),
    toAbsolute("assets/levels/a1.png"),
    toAbsolute("assets/levels/a2.png"),
    toAbsolute("assets/levels/b1.png"),
    toAbsolute("assets/levels/b2.png"),
    ...[
      "City.jpg", "population.jpg", "History.jpg", "Education.jpg",
      "Language.png", "food.jpg", "sightseeing.jpg", "religion.png", "economy.jpg"
    ].map(name => toAbsolute(`assets/countries/bangladesh/${name}`)),
    ...[
      "Rafikul_Islam.png", "n3_nondonpark1.jpeg", "n6_Rafi.jpeg",
      "n1_bandorban.jpg", "n7_caregiving1.jpg", "goethe.jpeg", "n10_india4.jpg"
    ].map(name => toAbsolute(`assets/people/rafi/${name}`)),
    toAbsolute("pages/a1.html"),
    toAbsolute("pages/a2.html"),
    toAbsolute("pages/b1.html"),
    toAbsolute("pages/b2.html"),
    toAbsolute("pages/course-enrollment.html"),
    toAbsolute("pages/library-topic.html"),
    toAbsolute("pages/practice.html"),
    toAbsolute("pages/download-center.html"),
    toAbsolute("pages/course-module.html"),
    toAbsolute("a1/"),
    toAbsolute("a2/"),
    toAbsolute("b1/"),
    toAbsolute("b2/"),
    toAbsolute("course-enrollment/"),
    toAbsolute("library-topic/"),
    toAbsolute("practice/"),
    toAbsolute("download-center/"),
    toAbsolute("course-module/")
  ];
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async cache => {
        await cache.addAll(coreUrls());
        await Promise.allSettled(optionalUrls().map(url => cache.add(url)));
      })
      .then(() => self.skipWaiting())
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
  return /\.(?:css|js|json|png|jpg|jpeg|gif|svg|webp|ico|webmanifest|woff2?|ttf|pdf)$/i.test(
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
          const pathOnly = `${requestUrl.origin}${requestUrl.pathname}`;
          return (
            (await cache.match(pathOnly, { ignoreSearch: true })) ||
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

