/**
 * Service Worker for Serrucho PWA
 * - Caches core assets for offline use
 * - Handles Web Push notifications
 * - Handles background sync when connectivity restores
 *
 * Mobile synergy: Expo's expo-notifications handles push on native apps.
 */

const CACHE_NAME = "serrucho-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/calculadora", "/manifest.json", "/icon.svg"];

// Install — cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback for navigation
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and API calls
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for navigations and static assets
        if (response.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/static/"))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Offline fallback — serve from cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Fallback to root for navigation requests
        if (request.mode === "navigate") {
          return (await caches.match("/")) ?? new Response("Offline", { status: 503 });
        }

        return new Response("Offline", { status: 503 });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Serrucho 🪚", {
      body: data.body ?? "Tienes un recordatorio de pago pendiente.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag ?? "serrucho-reminder",
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

// Notification click — open or focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const matching = clients.find((c) => c.url.includes(targetUrl));
        if (matching) return matching.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Handle local notification messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title, event.data.options ?? {});
  }
});
