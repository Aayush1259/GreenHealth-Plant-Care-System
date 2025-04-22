// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk_MrKGJM4zfB-E9iCKagmm2ET-nnnb-0",
  authDomain: "verdantai-30brj.firebaseapp.com",
  databaseURL: "https://verdantai-30brj-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "verdantai-30brj",
  storageBucket: "verdantai-30brj.firebasestorage.app",
  messagingSenderId: "952606178077",
  appId: "1:952606178077:web:36e472feaa72d616f2fff4"
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let analytics: Analytics | undefined;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

// Check if Firebase app has already been initialized
if (typeof window !== 'undefined' && getApps().length === 0) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    // Only initialize analytics on the client side if supported
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      } else {
        console.log('Analytics not supported in this environment');
      }
    }).catch(err => {
      console.error('Analytics initialization error:', err);
    });
    
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
  } catch (e) {
    console.error('Firebase initialization error', e);
  }
} else if (typeof window !== 'undefined' && getApps().length > 0) {
  // If already initialized, use that one
  firebaseApp = getApps()[0];
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
} else {
  // Server-side, initialize but don't use analytics
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
}

// Export the app instance and services
export { firebaseApp, auth, firestore, storage, analytics }; 