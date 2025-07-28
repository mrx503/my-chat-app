// This file must be in the public folder.

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const title = data.title || 'New Message';
    const options = {
      // Body of the notification
      body: data.body || 'You have a new message.',
      
      // Main icon that appears next to the text
      icon: '/logo.png', // Main visual icon

      // Small monochrome icon for the status bar (on Android)
      badge: '/logo.png',

      // A larger image to display within the notification
      image: 'https://placehold.co/300x200.png', // Placeholder for sender avatar or image preview

      // Vibration pattern: Vibrate 200ms, pause 100ms, vibrate 200ms
      vibrate: [200, 100, 200],
      
      // Makes the notification stay until the user interacts with it
      requireInteraction: true,

      // Timestamp for when the message was received
      timestamp: Date.now(),
      
      // Actions the user can take
      actions: [
        {
          action: 'open_chat',
          title: 'Open Chat'
        }
      ],
      
      // Data to pass to the notificationclick event
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
    // Fallback for plain text data
    const title = 'New Message';
    const options = {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
        data: {
            url: '/'
        }
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();

  // Get the URL from the notification data
  const urlToOpen = event.notification.data.url || '/';

  // Open the app/URL
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
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
