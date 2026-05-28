// ============================================================================
//  service-worker.js — makes JCABSS installable and load fast.
//  Strategy: cache the app shell (HTML/CSS/JS) for instant loads; always go to
//  the network for Supabase/API calls (never cache user data or AI responses).
// ============================================================================
const CACHE = "jcabss-v1";

// App shell files to pre-cache on install.
const SHELL = [
  "index.html",
  "dashboard.html",
  "upload.html",
  "note.html",
  "quiz.html",
  "exams.html",
  "teacher.html",
  "styles.css",
  "js/config.js",
  "js/session.js",
  "js/ai.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache Supabase / API / cross-origin POSTs — always hit the network.
  const isApi =
    url.hostname.endsWith("supabase.co") ||
    url.hostname.includes("supabase") ||
    e.request.method !== "GET";

  if (isApi) {
    e.respondWith(fetch(e.request).catch(() => new Response("", { status: 503 })));
    return;
  }

  // App shell & static assets: cache-first, fall back to network, update cache.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
