// This file is the service worker that handles push notifications.

// Listen for push events from the server
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const { title, body, url, icon, tag } = data;

      // These options control the appearance and behavior of the notification.
      const options = {
        body: body,
        icon: icon || '/favicon.ico', // The main icon for the notification
        badge: '/badge-96.png', // A monochrome icon for the status bar (Android)
        vibrate: [200, 100, 200], // A simple vibration pattern
        tag: tag || 'new-message', // Groups notifications together
        renotify: true, // Notifies the user for each new message, even with the same tag
        actions: [ // Adds action buttons to the notification
            { action: 'open_chat', title: 'Open Chat' }
        ],
        data: {
          url: url, // Attaches the URL to open when the notification is clicked
        },
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error('Error processing push event data:', e);
      // Fallback for simple text payloads
      const title = 'New Notification';
      const options = {
        body: event.data.text(),
        icon: '/favicon.ico',
        badge: '/badge-96.png',
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  }
});

// Listen for clicks on the notification
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Always close the notification when clicked

  const urlToOpen = event.notification.data.url;

  if (urlToOpen) {
    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then(function (clientList) {
          // If a window for the chat is already open, focus it.
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            // A simple check to see if the URL matches.
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is found, open a new one.
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
