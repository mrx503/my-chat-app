
// This is the service worker file.
// It's responsible for handling background tasks like push notifications.

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'New Message';
  const options = {
    body: data.body,
    // Use the provided icon, or a default one if not available.
    icon: data.icon || '/duck_logo_192.png',
    // Use the chat ID as a tag to group notifications
    tag: data.tag,
    // Add a vibration pattern for a more noticeable notification
    vibrate: [200, 100, 200],
    // Store the URL to open in the data payload
    data: {
      url: data.url
    },
    // No default actions to prevent "unsubscribe" etc.
    actions: [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();

  // Open the app or a specific URL
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
