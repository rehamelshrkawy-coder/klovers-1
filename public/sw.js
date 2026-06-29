// Klovers Service Worker — v2
// Strategy:
//   Static assets (JS/CSS/images) → Cache-First (immutable bundles)
//   Navigation (HTML)             → Network-First with offline fallback
//   Supabase API / edge functions → Network-Only (never cache auth/data)

const CACHE_PREFIX = "klovers-";
const STATIC_CACHE = `${CACHE_PREFIX}static-v2`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-v2`;
const OFFLINE_URL = "/offline.html";
const MAX_IMAGE_ENTRIES = 100;

// Assets to pre-cache on install (shell)
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/klovers-logo.jpg",
  "/klovers-mascot.svg",
  "/manifest.json",
  "/pwa-192.png",
  "/pwa-512.png",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE && key !== IMAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET, chrome-extension, or Supabase/API calls
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 2. Immutable static assets (hashed filenames) → Cache-First
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 3. Images: Cache-First with a bounded cache
  if (
    request.destination === "image" ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".avif")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(IMAGE_CACHE).then(async (cache) => {
                await cache.put(request, clone);
                const keys = await cache.keys();
                await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGE_ENTRIES)).map((key) => cache.delete(key)));
              });
            }
            return response;
          })
      )
    );
    return;
  }

  // 4. Navigation requests → Network-First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // 5. Everything else → Network-Only
});

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Klovers", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Klovers", {
      body: data.body || "",
      icon: "/klovers-logo.jpg",
      badge: "/favicon.ico",
      tag: data.tag || "klovers-notification",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "/";
  const parsedUrl = new URL(requestedUrl, self.location.origin);
  const targetUrl = parsedUrl.origin === self.location.origin ? parsedUrl.href : `${self.location.origin}/`;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === targetUrl && "focus" in c);
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
