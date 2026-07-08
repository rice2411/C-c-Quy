import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient dùng chung cho toàn app (epic #58 — migrate data-fetching sang React Query).
 *
 * ⚠️ Cấu hình mặc định BẮT BUỘC (QC chỉ ra 2 P0 — xem knowledge/frontend.md):
 *
 * 1. `structuralSharing: false`
 *    React Query mặc định deep-merge data mới với cache cũ để giữ reference ổn định.
 *    Nhưng dữ liệu ngày của app là **Timestamp object đã revive** (có method `.toDate()/.toMillis()`
 *    gắn trên object literal — xem services/api/client.ts). Structural sharing có thể **drop các
 *    method này** → tái phát họ bug #28/#32/#44 (`x.createdAt.toDate is not a function`), và đặc biệt
 *    nguy hiểm vì **chỉ vỡ ở refetch lần 2**, không vỡ lần đầu → dễ lọt QC. Tắt để giữ nguyên object.
 *
 * 2. `refetchOnWindowFocus: false`
 *    App nội bộ tiệm bánh không cần realtime gắt. Bật sẽ gây "nhảy data" khi alt-tab quay lại
 *    (list đổi sort, form đang nhập bị refetch đè).
 *
 * Lưu ý thêm khi viết query ở các phase sau:
 * - Mọi query phụ thuộc auth phải `enabled: !!currentUser` (tránh chạy trước khi auth ready → 401).
 * - Gọi `queryClient.clear()` khi logout (tránh user B thấy cache user A).
 * - `queryFn` nên gọi service hiện có (giữ fallback qua isApiEnabled), không viết lại HTTP.
 * - Consumer guard `data ?? []` (query lần đầu lỗi → data undefined).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing: false,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000, // 60s — data tiệm bánh không realtime, giảm refetch thừa
    },
    mutations: {
      retry: 0,
    },
  },
});
