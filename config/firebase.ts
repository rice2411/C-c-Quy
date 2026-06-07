/**
 * Firebase init cho FRONTEND — CHỈ Auth (đăng nhập + lấy ID token gửi cho BE).
 *
 * Firestore (db) & Storage đã chuyển HẾT sang BE NestJS — FE không còn dùng,
 * nên file này KHÔNG import firebase/firestore hay firebase/storage nữa
 * (giảm bundle, không lộ truy cập DB phía client).
 *
 * Lưu ý: serverless trong `api/` vẫn dùng `config/firestore` (Firestore-only)
 * độc lập với file này.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
