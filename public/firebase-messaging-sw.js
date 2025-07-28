
// This file must be in the public directory.

// In a real app, you would probably want to lazy-load this.
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQN_pWuhxObBi0lgpp9Hz7pMMp6nr3ey4",
  authDomain: "duck0-98a94.firebaseapp.com",
  projectId: "duck0-98a94",
  storageBucket: "duck0-98a94.appspot.com",
  messagingSenderId: "240052734588",
  appId: "1:240052734588:web:96dce3532ad3dd580157f9",
  measurementId: "G-NZJQ1Z91MV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }
  
  const data = event.data.json();
  console.log('Push data:', data);

  const title = data.title || 'New Message';
  const options = {
    body: data.body || 'You have a new message.',
    // The icon which will be displayed in the notification
    icon: '/logo.png',
    // A small monochrome icon for the status bar (on Android)
    badge: '/logo.png',
    // A vibration pattern to alert the user
    vibrate: [200, 100, 200],
    // A tag to group notifications together
    tag: data.tag || 'duck-chat-notification',
    // Whether to re-notify the user if a new notification arrives with the same tag
    renotify: true,
    // Data to be passed along with the notification
    data: {
      url: data.url || '/',
    },
    // Custom actions for the notification
    actions: [
      {
        action: 'open_chat',
        title: 'Open Chat',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  // This looks through all the windows/tabs the browser has open and focuses one if it exists.
  // If it doesn't find one, it opens a new window/tab.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // If a window is already open, focus it
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
