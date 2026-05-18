/**
 * Firebase init dùng chung cho mọi serverless webhook trong `/api`.
 *
 * Lý do tách riêng (không reuse `@/config/firebase`):
 *  - `@/config/firebase` import thêm `firebase/auth` và `firebase/storage` —
 *    không cần cho serverless, làm cold start chậm.
 *  - `@/*` alias chỉ được Vite resolve, Vercel @vercel/node builder không
 *    đọc paths từ root `tsconfig.json` → bắt buộc dùng relative import.
 *
 * Naming convention: folder `_lib` có prefix `_` → Vercel KHÔNG expose như
 * public route (chỉ files top-level dưới `/api/*` mới thành endpoint).
 *
 * Singleton pattern: dùng `getApps()` / `getApp()` để tái sử dụng Firebase
 * app giữa các invocation khi container ấm — tiết kiệm cold start.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.projectId) {
  // Log nhẹ — không throw để không kill cold start nếu env chưa set;
  // các webhook sẽ tự fail với error rõ ràng khi gọi Firestore.
  console.warn('[api/_lib/firebase] FIREBASE_PROJECT_ID is missing in env');
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export { app };
