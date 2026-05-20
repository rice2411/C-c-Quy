/**
 * Type shim cho Vercel-style serverless handler dùng chung trong toàn bộ
 * `api/` (sepay, facebook, ...).
 *
 * Đặt ở `types/` thay vì `api/_lib/` vì:
 *   - Type-only (compile-time), không sinh runtime code → tốt cho cả frontend lẫn backend.
 *   - Folder `types/` đã có barrel export → `import type { ApiRequest } from '@/types'`.
 *   - Tránh việc Vercel hiểu nhầm là endpoint khi đặt trong `api/`.
 */
export interface ApiRequest {
  method?: string;
  body?: any;
  query?: any;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (code: number) => { json: (data: any) => void };
  json: (data: any) => void;
}
