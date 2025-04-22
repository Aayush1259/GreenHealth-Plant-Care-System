self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('plant-detect-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icons/icon-192x192.jpg',
        '/icons/icon-512x512.jpg',
        // Add other assets you want to cache
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
}); 

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Time for your plant care task!',
        icon: data.icon || '/icons/logo.png',
        badge: '/icons/badge.png',
        tag: data.tag || 'reminder',
        data: data.data || { url: '/garden' },
        actions: [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200],
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'GreenHealth Reminder', options)
      );
    } catch (error) {
      console.error('Error showing push notification:', error);
      // Fallback notification if JSON parsing fails
      event.waitUntil(
        self.registration.showNotification('GreenHealth Reminder', {
          body: 'You have a plant care task to complete.',
          icon: '/icons/logo.png',
          badge: '/icons/badge.png',
          requireInteraction: true,
        })
      );
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/garden';

  if (event.action === 'view') {
    // If user clicked the "View" action
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes('/garden') && 'focus' in client) {
            return client.focus();
          }
        }
        // If no open window, open a new one
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Periodic sync for checking reminders (for background processing)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkForDueReminders());
  }
});

// Function to check for due reminders
async function checkForDueReminders() {
  try {
    // Use the Cache API to store reminder data
    const cache = await caches.open('reminder-cache');
    const response = await cache.match('reminders');
    
    if (response) {
      const reminders = await response.json();
      const now = new Date();
      
      // Check for due reminders
      const dueReminders = reminders.filter(reminder => {
        if (reminder.completed) return false;
        if (reminder.notificationSent) return false;
        
        const dueDate = new Date(reminder.dueDate);
        return dueDate <= now;
      });
      
      // Show notifications for due reminders
      for (const reminder of dueReminders) {
        await self.registration.showNotification(`Plant Care: ${reminder.title}`, {
          body: `It's time to ${reminder.reminderType} your ${reminder.plantName || 'plant'}`,
          icon: `/icons/${reminder.reminderType}.png`,
          badge: '/icons/badge.png',
          tag: `reminder-${reminder.id}`,
          requireInteraction: true,
          data: {
            url: '/garden',
            reminderId: reminder.id
          },
          actions: [
            {
              action: 'complete',
              title: 'Mark Complete'
            },
            {
              action: 'view',
              title: 'View'
            }
          ],
          vibrate: [200, 100, 200]
        });
        
        // Mark as sent
        reminder.notificationSent = true;
      }
      
      // Update the cache with the updated reminders
      await cache.put('reminders', new Response(JSON.stringify(reminders)));
    }
  } catch (error) {
    console.error('Error checking reminders in service worker:', error);
  }
} 