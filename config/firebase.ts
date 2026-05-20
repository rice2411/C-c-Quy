/**
 * Firebase init cho FRONTEND (kéo theo auth + storage).
 *
 * Serverless function trong `api/` KHÔNG nên import file này — auth/storage
 * tham chiếu browser globals lúc load → crash Vercel Node runtime. Dùng
 * `config/firestore` (Firestore-only) thay thế.
 *
 * `app` và `db` được share với `config/firestore` để không init 2 lần.
 */
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { app, db } from './firestore';

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);
