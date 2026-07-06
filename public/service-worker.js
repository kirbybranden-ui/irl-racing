// Minimal service worker — required by Chrome/Android for the app to be
// considered "installable." Does not cache anything or intercept requests;
// it just needs to exist and be registered for the install criteria to be met.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough — always fetch from network, no offline caching.
self.addEventListener("fetch", () => {});
