import axios from 'axios';
import { getSsoToken } from '@/services/auth/ssoToken';

/**
 * HTTP client gọi BE NestJS. Base URL lấy từ env `VITE_API_URL`. Mỗi request tự
 * gắn SSO JWT (RiceService phát sau khi đăng nhập Google) vào header Authorization.
 */
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL || '';

/** BE đã cấu hình chưa (FE có thể fallback nếu chưa). */
export const isApiEnabled = (): boolean => Boolean(API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Gắn SSO JWT (lưu ở localStorage) vào mỗi request. Token bền qua reload nên
// không còn cảnh "request đầu bị thiếu token" như thời auth cũ (authStateReady).
apiClient.interceptors.request.use((config) => {
  const token = getSsoToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * BE cũ serialize Timestamp thành { _seconds, _nanoseconds }
 * (mất method .toDate()). Component FE cũ vẫn gọi `x.createdAt.toDate()` → revive
 * lại các object đó thành "Timestamp-like" có .toDate()/.toMillis() để tương thích.
 */
const isTsLike = (v: any): boolean =>
  v && typeof v === 'object' &&
  (typeof v._seconds === 'number' || typeof v.seconds === 'number') &&
  (typeof v._nanoseconds === 'number' || typeof v.nanoseconds === 'number');

// Chuỗi ISO datetime do Postgres (timestamptz) sinh ra: có 'T' + giây + offset/Z.
// (date-only "yyyy-mm-dd" hoặc chuỗi SePay tự do KHÔNG khớp → giữ nguyên string.)
const PG_ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

const tsLikeFromMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const nanoseconds = (ms % 1000) * 1e6;
  return {
    seconds,
    nanoseconds,
    _seconds: seconds,
    _nanoseconds: nanoseconds,
    toDate: () => new Date(ms),
    toMillis: () => ms,
  };
};

const reviveTimestamps = (input: any): any => {
  // Postgres trả timestamp dạng ISO string → hồi sinh thành Timestamp-like (có .toDate())
  // để tương thích code FE cũ (giống hệt khi BE còn trả {_seconds}).
  if (typeof input === 'string') {
    if (PG_ISO_TS.test(input)) {
      const ms = Date.parse(input);
      if (!Number.isNaN(ms)) return tsLikeFromMs(ms);
    }
    return input;
  }
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
