// Service Worker para Web Push de Trippy Land Store
const CACHE_NAME = "trippy-land-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuchar notificaciones Push entrantes
self.addEventListener("push", (event) => {
  let data = {
    title: "Trippy Land Store",
    body: "Tienes una actualización de tu pedido",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: { url: "/" },
    tag: "default-order",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.png",
    badge: data.badge || "/favicon.png",
    tag: data.tag || "order-notification",
    renotify: true,
    data: data.data || { url: "/" },
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Ver Pedido" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Al pulsar sobre la notificación del sistema
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta con esa URL o de la app, enfocarla
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      // Si no, abrir una nueva ventana con la ruta del pedido
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
