/**
 * Hàng đợi gửi ẢNH đơn (thẻ chia sẻ) vào nhóm Zalo — xử lý NỀN, không chặn tạo đơn.
 * orderService.addOrder đẩy job (non-React); ZaloShareQueueHost (React) lắng nghe,
 * render thẻ off-screen → chụp ảnh → upload → gửi Zalo (fallback text nếu lỗi).
 */
export interface ZaloShareJob {
  order: any;
  groupIds: string[];
}

let queue: ZaloShareJob[] = [];
let listener: (() => void) | null = null;

/** Đẩy 1 đơn vào hàng đợi gửi ảnh Zalo (fire-and-forget). */
export const enqueueOrderShare = (order: any, groupIds: string[]): void => {
  if (!order || !Array.isArray(groupIds) || groupIds.length === 0) return;
  queue.push({ order, groupIds });
  listener?.();
};

export const dequeueOrderShare = (): ZaloShareJob | undefined => queue.shift();

/** Host đăng ký để được đánh thức khi có job mới. */
export const setZaloShareListener = (fn: (() => void) | null): void => {
  listener = fn;
};
