/**
 * Firestore-only init.
 *
 * Tách khỏi `config/firebase.ts` để các serverless function trong `api/`
 * **không bị kéo theo** `firebase/auth` + `firebase/storage` (2 module này
 * tham chiếu browser globals lúc load module → crash trên Vercel Node runtime
 * với `FUNCTION_INVOCATION_FAILED`).
 *
 *   - Frontend: vẫn import qua `@/config/firebase` (re-export `db` từ đây).
 *   - Serverless: import trực tiếp `import { db } from '@/config/firestore'`
 *     → bundle chỉ chứa `firebase/app` + `firebase/firestore`.
 */
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
};

// Reuse app nếu đã initializeApp ở chỗ khác (vd config/firebase.ts ở frontend) —
// `initializeApp` lần 2 trên cùng project sẽ throw, nên check trước.
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// `experimentalForceLongPolling: true` giữ nguyên hành vi cũ (giúp frontend
// chạy được trong môi trường network bị restrict streaming). Trên Node
// serverless cũng không sao — long polling vẫn ổn.
export const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
