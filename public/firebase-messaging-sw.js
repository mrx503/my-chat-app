
// The service worker needs to be present to handle background notifications.
// It must be in the public folder.

// This event listener is fired when the service worker is installed.
self.addEventListener('install', (event) => {
  // This forces the waiting service worker to become the active service worker.
  self.skipWaiting();
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});


// Listen for incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Service Worker: Push data', data);

    const title = data.title || 'New Message';
    const options = {
      body: data.body || 'You have a new message.',
      // The icon to be displayed in the notification.
      icon: '/logo.png', 
      // A small icon shown in the status bar on Android.
      badge: '/logo.png',
      // A vibration pattern to run with the display of the notification.
      vibrate: [200, 100, 200],
      // A timestamp associated with a notification.
      timestamp: Date.now(),
      // The URL to open when the user clicks the notification.
      data: {
        url: data.url || '/',
      },
      // Actions to display in the notification.
      actions: [
        {
          action: 'open_chat',
          title: 'Open Chat',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error parsing push data:', e);
    // Fallback for non-JSON data
    const title = 'New Message';
    const options = {
      body: event.data.text(),
      icon: '/logo.png',
      badge: '/logo.png',
      data: {
        url: '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Listen for clicks on the notification
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked.');
  
  // Close the notification
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  // This looks at all open tabs and focuses one if it's already open.
  // Otherwise, it opens a new tab.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
