// UoN Event Hub service worker.
// Strategy:
//  - Same-origin GET requests under /e/<slug>/schedule, /e/<slug>/sessions
//    and the brand assets are stored in a runtime cache with stale-while-
//    revalidate so attendees can still browse the programme with a flaky
//    or completely missing connection.
//  - Everything else falls through to the network. Push notifications are
//    handled below.

const CACHE_NAME = "uon-event-hub-v1";
const PRECACHE = ["/uon-logo.png", "/uon-lockup.png", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

function shouldCache(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/data")) return false;
  if (PRECACHE.includes(url.pathname)) return true;
  // Cache event hub schedule, session list, session detail and ondemand.
  return /^\/e\/[^/]+(?:\/(schedule|sessions|ondemand)(?:\/.*)?)?\/?$/.test(
    url.pathname,
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!shouldCache(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

// -------- Push notifications --------
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "UoN Event Hub", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "UoN Event Hub";
  const options = {
    body: payload.body || "",
    icon: "/uon-logo.png",
    badge: "/favicon.png",
    data: { url: payload.url || "/" },
    tag: payload.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          w.navigate(target);
          return w.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    }),
  );
});
