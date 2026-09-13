const CACHE_NAME = "table-stakes-dev-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const responseCopy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy)));
      }
      return response;
    }).catch(async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;
      if (request.mode === "navigate") return caches.match("/");
      return Response.error();
    }),
  );
});
