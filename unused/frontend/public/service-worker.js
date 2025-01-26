const CACHE_NAME = "harmonic-universe-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/assets/logo.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
];

const DYNAMIC_CACHE = "dynamic-v1";
const API_CACHE = "api-v1";
const IMAGE_CACHE = "images-v1";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith("harmonic-universe-") && name !== CACHE_NAME;
          })
          .map((name) => {
            return caches.delete(name);
          }),
      );
    }),
  );
});

// Helper function to determine if a request is for an API call
function isApiRequest(request) {
  return request.url.includes("/api/");
}

// Helper function to determine if a request is for an image
function isImageRequest(request) {
  return (
    request.destination === "image" ||
    request.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)
  );
}

// Helper function to determine if we should cache the response
function shouldCache(response) {
  return response && response.status === 200 && response.type === "basic";
}

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Handle API requests
  if (isApiRequest(request)) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (shouldCache(response)) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached response if available
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cached response, return a custom offline response
              return new Response(
                JSON.stringify({
                  error: "You are offline. Please check your connection.",
                  offline: true,
                }),
                {
                  headers: { "Content-Type": "application/json" },
                },
              );
            });
          });
      }),
    );
    return;
  }

  // Handle image requests
  if (isImageRequest(request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached image
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (shouldCache(response)) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return a placeholder image if offline
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
                  '<rect width="100%" height="100%" fill="#eee"/>' +
                  '<text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif">' +
                  "Image Offline</text></svg>",
                {
                  headers: { "Content-Type": "image/svg+xml" },
                },
              );
            });
        });
      }),
    );
    return;
  }

  // Handle all other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!shouldCache(response)) {
            return response;
          }

          // Cache successful responses in dynamic cache
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          // Return a basic offline response for other requests
          return new Response("Offline content not available", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    }),
  );
});

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(
      // Get all failed requests from IndexedDB and retry them
      getFailedRequests().then((requests) => {
        return Promise.all(
          requests.map((request) => {
            return fetch(request).then((response) => {
              if (response.ok) {
                // Remove from failed requests if successful
                return removeFailedRequest(request);
              }
              throw new Error("Sync failed");
            });
          }),
        );
      }),
    );
  }
});

// Push notification handling
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Harmonic Universe", options),
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    // Open the app and navigate to specific content
    event.waitUntil(clients.openWindow("/"));
  }
});
