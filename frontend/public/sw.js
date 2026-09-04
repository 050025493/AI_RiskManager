self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "AI Risk Manager";
  const options = {
    body: payload.body || "A new risk alert requires your attention.",
    data: { url: payload.url || "/?page=alerts" },
    tag: payload.tag || "risk-alert",
    renotify: Boolean(payload.renotify),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/?page=alerts", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existingClient) {
        existingClient.postMessage({ type: "open-alert-queue" });
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});