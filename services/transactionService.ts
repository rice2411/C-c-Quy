import { apiClient } from '@/services/api/client';
import { Transaction } from '@/types';

/** Danh sách giao dịch (BE sắp theo ngày giảm dần). */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions');
  return res.data;
};

/** Đánh dấu giao dịch là không liên quan đến hệ thống (hoặc bỏ đánh dấu). */
export const markTransactionExternal = async (
  transactionId: string,
  isExternal: boolean,
): Promise<void> => {
  await apiClient.patch(`/transactions/${transactionId}/external`, { isExternal });
};

/** Đánh dấu / bỏ: giao dịch tiền ra đã "kết toán" (chuyển về TK chính). */
export const markTransactionSettled = async (
  transactionId: string,
  settled: boolean,
): Promise<void> => {
  await apiClient.patch(`/transactions/${transactionId}/settled`, { settled });
};

/** Liên kết giao dịch với 1 đơn: ghi orderNumber xuống transaction để khớp đối soát.
 *  Truyền orderNumber rỗng để gỡ liên kết. */
export const linkTransactionOrder = async (
  transactionId: string,
  orderNumber: string,
): Promise<void> => {
  await apiClient.patch(`/transactions/${transactionId}/link`, { orderNumber });
};

/** Giao dịch SePay tiền ra (transferType='out') CHƯA gắn phiếu hoàn nào —
 *  để chọn khi đối soát phiếu hoàn (#186). BE sắp theo ngày giảm dần. */
export const fetchOutUnlinkedTransactions = async (): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions/out-unlinked');
  return res.data;
};

export const fetchTransactionsByOrderNumber = async (
  orderNumber: string,
): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions/by-order', {
    params: { orderNumber },
  });
  return res.data;
};

/* ───────────────────────── Đối soát hàng loạt ─────────────────────────── */

/** 1 cặp GD↔đơn khớp tự động (BE trả ở preview). */
export interface ReconcileMatch {
  transactionId: string;
  sepayId: number;
  orderId: string;
  orderNumber: string;
  amount: number;
  transactionDate: string;
  orderCreatedAt: string;
}

export interface ReconcilePreviewResult {
  /** Các cặp GD↔đơn khớp DUY NHẤT (sẽ ghi nếu user confirm). */
  matched: ReconcileMatch[];
  /** GD có ≥2 đơn ứng viên / tranh chấp → bỏ qua, khớp tay. */
  skippedAmbiguous: number;
  /** GD không tìm được đơn nào khớp. */
  skippedNoMatch: number;
  /** Tổng GD chưa khớp đã quét. */
  totalUnmatched: number;
}

/** Preview (dry-run): quét toàn bộ GD chưa khớp → trả các cặp sẽ map. KHÔNG ghi. */
export const reconcileTransactionsPreview = async (): Promise<ReconcilePreviewResult> => {
  const res = await apiClient.post<ReconcilePreviewResult>('/transactions/reconcile/preview');
  return res.data;
};

/** Apply: ghi map cho danh sách cặp user đã confirm (BE atomic + idempotent). */
export const reconcileTransactionsApply = async (
  pairs: ReconcileMatch[],
): Promise<{ applied: number; skipped: number }> => {
  const res = await apiClient.post<{ applied: number; skipped: number }>(
    '/transactions/reconcile/apply',
    { pairs },
  );
  return res.data;
};
