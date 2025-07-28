// This file MUST be in the /public directory

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'New Message';
    const options = {
      body: data.body,
      // Icon that appears within the notification itself
      icon: '/logo.png',
      // Small monochrome icon for the status bar (on Android)
      badge: '/logo.png', 
      // Vibration pattern: 200ms vibrate, 100ms pause, 200ms vibrate
      vibrate: [200, 100, 200],
      // Ensures each new notification from the same chat makes a sound/vibrates
      renotify: true,
      // Groups notifications so they don't spam the user
      tag: data.tag || 'duck-chat-notification',
      // The URL to open when the notification body is clicked
      data: {
        url: data.url,
      },
      actions: [
        {
          action: 'open_chat',
          title: 'Open Chat',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error parsing push data:', error);
    const title = 'New Message';
    const options = {
      body: event.data.text(),
      icon: '/logo.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  const urlToOpen = notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If a window for the app is already open, focus it.
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window.
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});