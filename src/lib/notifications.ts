import { getFirestore, collection, query, where, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

// Extend the NotificationOptions interface to include browser-specific properties
interface ExtendedNotificationOptions extends NotificationOptions {
  // Add missing notification properties
  actions?: Array<{ action: string; title: string }>;
  vibrate?: number[];
  badge?: string;
  showTrigger?: any; // For scheduled notifications
}

// Registration with periodic sync
interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register: (tag: string, options: { minInterval: number }) => Promise<void>;
  };
}

/**
 * Request notification permissions and register for push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported in this browser');
    return false;
  }

  // Check if we already have permission
  if (Notification.permission === 'granted') {
    // Register service worker if not registered
    await registerServiceWorker();
    return true;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if permission is granted
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Register the service worker for push notifications
 */
async function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      }) as PeriodicSyncRegistration;
      
      console.log('Service worker registration successful with scope:', registration.scope);
      
      // Wait for the service worker to be fully activated before registering periodic sync
      if (registration.active) {
        await registerPeriodicSync(registration);
      } else {
        // If service worker is still installing, wait for it to activate
        const activeServiceWorker = await new Promise<ServiceWorker>((resolve) => {
          if (registration.active) {
            resolve(registration.active);
            return;
          }
          
          // Wait for the installing service worker to become active
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  resolve(newWorker);
                }
              });
            }
          });
          
          // In case we missed the updatefound event
          if (registration.waiting) {
            resolve(registration.waiting);
          }
        });
        
        console.log('Service worker activated:', activeServiceWorker.state);
        await registerPeriodicSync(registration);
      }
      
      return registration;
    }
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

/**
 * Register for periodic sync once service worker is active
 */
async function registerPeriodicSync(registration: PeriodicSyncRegistration) {
  if (!registration.periodicSync) {
    console.log('Periodic Sync API is not supported');
    return;
  }
  
  try {
    // Check if we have permission to use background sync
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as any,
    });
    
    if (status.state === 'granted') {
      try {
        // Register to check reminders every 1 hour (minimum interval is typically 1 hour on most browsers)
        await registration.periodicSync.register('check-reminders', {
          minInterval: 60 * 60 * 1000, // 1 hour in milliseconds
        });
        console.log('Periodic sync registered successfully');
      } catch (error) {
        console.error('Failed to register periodic sync:', error);
      }
    } else {
      console.log('Periodic background sync permission not granted:', status.state);
    }
  } catch (error) {
    console.error('Error checking periodic sync permission:', error);
  }
}

/**
 * Check if notifications are allowed
 */
export function areNotificationsAllowed(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Schedule a push notification for a specific time
 */
export async function scheduleNotification(reminder: {
  id: string;
  title: string; 
  description?: string;
  plantName?: string;
  reminderType: string;
  dueDate: Date | any;
}): Promise<boolean> {
  if (!areNotificationsAllowed() || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    // Store the reminder in the cache for the service worker to access
    await syncReminderWithServiceWorker(reminder);
    
    // For browsers that don't support triggers natively, we'll rely on periodic sync
    console.log('Using periodic sync for scheduled notifications');

    // Schedule a future check for this reminder
    const dueDate = reminder.dueDate.toDate?.() || reminder.dueDate;
    console.log(`Reminder scheduled for background check at ${dueDate}`);
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
}

/**
 * Sync reminder data with service worker
 */
async function syncReminderWithServiceWorker(reminder: any) {
  try {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('reminder-cache');
      const response = await cache.match('reminders');
      
      let reminders = [];
      if (response) {
        reminders = await response.json();
      }
      
      // Find if reminder already exists
      const existingIndex = reminders.findIndex((r: any) => r.id === reminder.id);
      if (existingIndex >= 0) {
        // Update existing reminder
        reminders[existingIndex] = reminder;
      } else {
        // Add new reminder
        reminders.push(reminder);
      }
      
      // Store updated reminders
      await cache.put('reminders', new Response(JSON.stringify(reminders)));
    }
  } catch (error) {
    console.error('Error syncing reminder with service worker:', error);
  }
}

/**
 * Send a notification for a reminder
 */
export function sendReminderNotification(reminder: {
  id: string;
  title: string; 
  description?: string;
  plantName?: string;
  reminderType: string;
}) {
  if (!areNotificationsAllowed()) return false;
  
  try {
    // Try to use service worker for notification if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`Plant Care: ${reminder.title}`, {
          body: reminder.description || (reminder.plantName ? `For: ${reminder.plantName}` : ''),
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
        } as ExtendedNotificationOptions);
      });
      return true;
    }
    
    // Fallback to regular Notification API
    const notificationTitle = `Plant Care Reminder: ${reminder.title}`;
    const notificationOptions: ExtendedNotificationOptions = {
      body: reminder.description || (reminder.plantName ? `For: ${reminder.plantName}` : ''),
      icon: `/icons/${reminder.reminderType}.png`,
      tag: `reminder-${reminder.id}`,
      requireInteraction: true
    };
    
    const notification = new Notification(notificationTitle, notificationOptions);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      window.location.href = '/garden';
    };
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Check for due reminders and send notifications
 * This should be called on app startup and periodically
 */
export async function checkDueReminders(): Promise<void> {
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const user = auth.currentUser;

  if (!user?.email) return;
  
  try {
    // Get all reminders for the current user that are not completed
    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef, 
      where('userEmail', '==', user.email),
      where('completed', '==', false),
      where('notificationSent', '==', false) // Only get reminders where notification hasn't been sent
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    // Sync all reminders with service worker for background checking
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('reminder-cache');
      const reminders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      await cache.put('reminders', new Response(JSON.stringify(reminders)));
    }
    
    for (const docSnap of querySnapshot.docs) {
      const reminder = docSnap.data();
      
      // Check if the reminder is due
      const dueDate = new Date(reminder.dueDate.toDate?.() || reminder.dueDate);
      
      // If the reminder is in the future, try to schedule a notification
      if (dueDate > now) {
        await scheduleNotification({
          id: docSnap.id,
          title: reminder.title,
          description: reminder.description,
          plantName: reminder.plantName,
          reminderType: reminder.reminderType,
          dueDate: reminder.dueDate
        });
        continue;
      }
      
      // If the reminder is due or overdue
      if (dueDate <= now) {
        // Show a notification
        sendReminderNotification({
          id: docSnap.id,
          title: reminder.title,
          description: reminder.description,
          plantName: reminder.plantName,
          reminderType: reminder.reminderType
        });
        
        // Mark the notification as sent
        await updateDoc(doc(db, 'reminders', docSnap.id), {
          notificationSent: true,
        });
      }
    }
  } catch (error) {
    console.error('Error checking due reminders:', error);
  }
}

// Function to show a notification
export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/android-chrome-192x192.png',
            ...options,
            badge: '/icons/badge.png',
            requireInteraction: true,
            vibrate: [200, 100, 200]
          } as ExtendedNotificationOptions);
        });
      } else {
        const notification = new Notification(title, {
          icon: '/android-chrome-192x192.png',
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();

          if (options?.data?.url) {
            window.location.href = options.data.url;
          }
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

// Function to re-check for today's reminders (call this when user enables notifications)
export async function checkTodaysReminders(): Promise<void> {
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const user = auth.currentUser;

  if (!user?.email) return;
  
  try {
    // Get all unnotified reminders for today
    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef, 
      where('userEmail', '==', user.email),
      where('completed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Filter for reminders due today
    const todaysReminders = querySnapshot.docs.filter(docSnap => {
      const reminder = docSnap.data();
      const dueDate = new Date(reminder.dueDate.toDate?.() || reminder.dueDate);
      const reminderDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      return reminderDate.getTime() === today.getTime() && !reminder.notificationSent;
    });
    
    if (todaysReminders.length > 0) {
      // Show a summary notification
      showNotification(`${todaysReminders.length} reminders due today`, {
        body: `You have ${todaysReminders.length} plant care tasks due today.`,
        data: {
          url: '/garden',
        },
      });
      
      // Mark all as notified
      for (const docSnap of todaysReminders) {
        await updateDoc(doc(db, 'reminders', docSnap.id), {
          notificationSent: true,
        });
      }
    }
  } catch (error) {
    console.error('Error checking today\'s reminders:', error);
  }
}

// Setup notifications
export async function setupNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    // Check for due reminders immediately
    await checkDueReminders();
    
    // Also check for today's reminders
    await checkTodaysReminders();
  } else {
    // Optionally show a toast message encouraging permissions
    toast({
      title: "Enable Notifications",
      description: "Enable notifications to get reminders for your plants."
    });
  }
} 