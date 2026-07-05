// Service Worker — App "Papa en Mousse"
// Gère les push notifications même quand l'application est fermée.

const APP_URL = "/admin-live";

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "Papa en Mousse", body: event.data.text() }; }

  const title   = data.title || "Papa en Mousse";
  const options = {
    body:    data.body  || "Nouvelle alerte en attente.",
    icon:    "/pem-icon-192.png",
    badge:   "/pem-icon-192.png",
    tag:     "pem-alert",
    renotify: true,
    vibrate: [200, 100, 200],
    data:    { url: data.url || APP_URL },
    actions: [
      { action: "open",    title: "Voir les alertes" },
      { action: "dismiss", title: "Ignorer" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = (event.notification.data && event.notification.data.url) || APP_URL;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte → focus
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Sinon → ouvrir un nouvel onglet
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Cache de base pour mode hors-ligne
const CACHE_NAME = "pem-v1";
const OFFLINE_ASSETS = ["/admin-live", "/pem-icon-192.png", "/pem-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Handler fetch : requis pour l'installabilité PWA (réponse hors-ligne en secours)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match("/admin-live"))
    )
  );
});
