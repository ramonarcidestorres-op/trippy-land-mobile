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
    title: "Actualización de tu pedido",
    body: "Tienes una actualización de tu pedido",
    icon: "/tripi-logo-app.png",
    badge: "/tripi-logo-app.png",
    sound: "/notification.wav",
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

  // Patrón de vibración fuerte y extendido estilo WhatsApp
  const strongVibration = [500, 110, 500, 110, 450];

  const options = {
    body: data.body,
    icon: data.icon || "/tripi-logo-app.png",
    badge: data.badge || "/tripi-logo-app.png",
    sound: data.sound || "/notification.wav",
    tag: data.tag || "order-notification",
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: data.vibrate || strongVibration,
    data: data.data || { url: "/" },
    actions: [
      { action: "open", title: "Ver Pedido" }
    ]
  };

  // Notificar a las ventanas abiertas para reproducir el tono de WhatsApp por altavoz
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ type: "PLAY_WHATSAPP_SOUND", data });
    }
  });

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
      // Si ya hay una ventana abierta con esa URL o de la app, enfocarla y sonar
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl) || client.url.includes(self.location.origin)) {
            client.postMessage({ type: "PLAY_WHATSAPP_SOUND" });
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
