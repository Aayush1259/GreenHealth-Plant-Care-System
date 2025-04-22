import { getApps, initializeApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if it hasn't been initialized yet
let app: App;
let auth: any;
let adminDb: any;

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

if (!getApps().length) {
  // Check if we have the service account credentials
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountStr) {
    if (isDevelopment) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is not set - using mock Firebase Admin');
      
      // Mock Firebase Admin services for development
      auth = {
        verifyIdToken: async () => ({ uid: 'mock-uid', email: 'dev@example.com' })
      };
      
      adminDb = {
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: false, data: () => ({}) }),
            set: async () => ({}),
            update: async () => ({})
          }),
          where: () => ({
            get: async () => ({ empty: true, docs: [] })
          })
        })
      };
    } else {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }
  } else {
    try {
      // Parse the JSON string to an object
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountStr, 'base64').toString()
      ) as ServiceAccount;
      
      app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      
      auth = getAuth(app);
      adminDb = getFirestore(app);
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      
      if (isDevelopment) {
        console.warn('⚠️ Using mock Firebase Admin instead');
        // Mock Firebase Admin services for development
        auth = {
          verifyIdToken: async () => ({ uid: 'mock-uid', email: 'dev@example.com' })
        };
        
        adminDb = {
          collection: () => ({
            doc: () => ({
              get: async () => ({ exists: false, data: () => ({}) }),
              set: async () => ({}),
              update: async () => ({})
            }),
            where: () => ({
              get: async () => ({ empty: true, docs: [] })
            })
          })
        };
      } else {
        throw new Error('Failed to initialize Firebase Admin');
      }
    }
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  adminDb = getFirestore(app);
}

export { auth, adminDb };

// Note: Add this to your .env.local file:
// FIREBASE_SERVICE_ACCOUNT_KEY=<base64 encoded service account key JSON>
// You can generate this by running:
// node -e "console.log(Buffer.from(require('./serviceAccountKey.json')).toString('base64'))" 