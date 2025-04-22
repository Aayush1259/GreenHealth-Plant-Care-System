// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };