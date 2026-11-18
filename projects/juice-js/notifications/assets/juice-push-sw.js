/*
 * Juice Notifications' service worker for Web Push (@juice-js/notifications). Copy it to the app's root (angular.json assets:
 * { "glob": "juice-push-sw.js", "input": "node_modules/@juice-js/notifications/assets", "output": "/" }) and pass its URL to enableWebPush.
 *
 * The service sends { title, body, url, deliveryId }. A notification shows the title and body; one per delivery (its tag), so a resend replaces
 * it. Clicking it focuses a window already on the link, or opens one.
 */
self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { title: event.data ? event.data.text() : '' };
  }
  const title = message.title || 'Notification';
  event.waitUntil(self.registration.showNotification(title, {
    body: message.body || '',
    tag: message.deliveryId || undefined,
    data: { url: message.url || null, deliveryId: message.deliveryId || null },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (!url) {
    return;
  }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((w) => w.url === url);
    if (open) {
      return open.focus();
    }
    return self.clients.openWindow(url);
  })());
});
