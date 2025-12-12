import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { onMessage } from "firebase/messaging";
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('Message received: ', payload);
});
// Use experimentalForceLongPolling to prevent connection timeouts in restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});