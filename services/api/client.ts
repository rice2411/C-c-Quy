import axios from 'axios';
import { auth } from '@/config/firebase';

/**
 * HTTP client gọi BE NestJS. Base URL lấy từ env `VITE_API_URL`
 * (vd https://cucquy-bakery-server.up.railway.app/api). Mỗi request tự
 * gắn Firebase ID token vào header Authorization.
 */
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL || '';

/** BE đã cấu hình chưa (FE có thể fallback Firestore trực tiếp nếu chưa). */
export const isApiEnabled = (): boolean => Boolean(API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Tự gắn ID token của user đang đăng nhập.
// QUAN TRỌNG: lúc app mới mở, Firebase Auth chưa khôi phục xong → auth.currentUser
// tạm null. Phải ĐỢI authStateReady() trước, nếu không request đầu tiên sẽ thiếu
// token → BE trả 401 → trang trống tới khi refresh. Đây là fix cho lỗi "vào trang
// bị empty, refresh mới có data".
apiClient.interceptors.request.use(async (config) => {
  if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
    await (auth as any).authStateReady();
  }
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * BE (firebase-admin) serialize Firestore Timestamp thành { _seconds, _nanoseconds }
 * (mất method .toDate()). Component FE cũ vẫn gọi `x.createdAt.toDate()` → revive
 * lại các object đó thành "Timestamp-like" có .toDate()/.toMillis() để tương thích.
 */
const isTsLike = (v: any): boolean =>
  v && typeof v === 'object' &&
  (typeof v._seconds === 'number' || typeof v.seconds === 'number') &&
  (typeof v._nanoseconds === 'number' || typeof v.nanoseconds === 'number');

const reviveTimestamps = (input: any): any => {
  if (Array.isArray(input)) return input.map(reviveTimestamps);
  if (input && typeof input === 'object') {
    if (isTsLike(input)) {
      const seconds = input._seconds ?? input.seconds;
      const nanoseconds = input._nanoseconds ?? input.nanoseconds ?? 0;
      const ms = seconds * 1000 + Math.floor(nanoseconds / 1e6);
      return {
        seconds,
        nanoseconds,
        _seconds: seconds,
        _nanoseconds: nanoseconds,
        toDate: () => new Date(ms),
        toMillis: () => ms,
      };
    }
    const out: Record<string, any> = {};
    for (const k of Object.keys(input)) out[k] = reviveTimestamps(input[k]);
    return out;
  }
  return input;
};

// BE trả envelope { data, message, statusCode, success }. Tự bóc `.data` cho
// các response thành công; lỗi → reject kèm message từ envelope.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      response.data = reviveTimestamps(body.data);
    }
    return response;
  },
  (error) => {
    const env = error?.response?.data;
    const message =
      (env && typeof env === 'object' && typeof env.message === 'string' && env.message) ||
      error?.message ||
      'Lỗi không xác định';
    return Promise.reject(new Error(String(message)));
  },
);
