// This service worker file is intentionally left almost empty.
// It is required for Firebase and web push notifications to work,
// but the actual logic for displaying notifications is handled by
// the browser based on the options passed from the client-side code.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// This listener handles displaying the notification itself
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    
    // Log for debugging purposes
    console.log("Push received", data);

    const options = {
      body: data.body,
      icon: '/logo.png',     // Main icon for the notification body
      badge: '/logo.png',    // Small monochrome icon for the status bar (on Android)
      vibrate: [200, 100, 200, 100, 200, 100, 200], // A simple vibration pattern
      data: {
        url: data.url, // Pass the URL to the click handler
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error("Error handling push event:", error);
    // Fallback notification
    const options = {
      body: "You have a new message.",
      icon: '/logo.png',
      badge: '/logo.png',
    };
     event.waitUntil(
      self.registration.showNotification("New Message", options)
    );
  }
});

// This listener handles what happens when the user clicks the notification
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(clientList => {
      // If a window for the app is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
