import { apiClient } from '@/services/api/client';
import { Transaction, ExpenseRule } from '@/types';

/** Danh sách giao dịch (BE sắp theo ngày giảm dần). */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions');
  return res.data;
};

/** Set tay phân loại chi phí cho 1 giao dịch (category + cờ loại khỏi chi phí). */
export const setTransactionExpense = async (
  transactionId: string,
  category: string | null,
  excluded: boolean,
): Promise<void> => {
  await apiClient.patch(`/transactions/${transactionId}/expense`, { category, excluded });
};

/** Danh sách rule phân loại chi phí (nội dung CK → category). */
export const fetchExpenseRules = async (): Promise<ExpenseRule[]> => {
  const res = await apiClient.get<ExpenseRule[]>('/transactions/expense-rules');
  return Array.isArray(res.data) ? res.data : [];
};

/** Thay toàn bộ rule; trả list mới. */
export const saveExpenseRules = async (
  items: { keyword: string; category: string }[],
): Promise<ExpenseRule[]> => {
  const res = await apiClient.put<ExpenseRule[]>('/transactions/expense-rules', { items });
  return Array.isArray(res.data) ? res.data : [];
};

/** Auto phân loại bank-out theo rule; trả số bản ghi đã gán. */
export const applyExpenseRules = async (): Promise<number> => {
  const res = await apiClient.post<{ classified: number }>('/transactions/expense/apply-rules');
  return typeof res.data?.classified === 'number' ? res.data.classified : 0;
};

/** Tổng hợp chi phí (OPEX) theo category trong kỳ. */
export const fetchExpenseSummary = async (
  fromISO: string,
  toISO: string,
): Promise<{ category: string; amount: number }[]> => {
  const res = await apiClient.get<{ category: string; amount: number }[]>('/transactions/expense-summary', {
    params: { from: fromISO, to: toISO },
  });
  return Array.isArray(res.data)
    ? res.data.map((x) => ({ category: String(x.category), amount: typeof x.amount === 'number' ? x.amount : 0 }))
    : [];
};

/** Bank-out trong kỳ (kèm phân loại) — màn Chi phí vận hành. */
export const fetchExpenseOut = async (fromISO: string, toISO: string): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions/expense-out', {
    params: { from: fromISO, to: toISO },
  });
  return Array.isArray(res.data) ? res.data : [];
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

// ── Đối soát CHI PHÍ: tiền RA ↔ chi phí thủ công (chống đếm trùng) ──

/** 1 cặp GD tiền-ra ↔ chi phí tay khớp tự động (từ preview). */
export interface ExpenseReconcileMatch {
  transactionId: string;
  expenseId: string;
  amount: number;
  transactionDate: string;
  expenseDate: string;
  category: string | null;
  note: string | null;
  description: string | null;
}

export interface ExpenseReconcilePreviewResult {
  /** Các cặp tiền-ra ↔ chi phí khớp DUY NHẤT (số tiền + gần ngày). */
  matched: ExpenseReconcileMatch[];
  /** GD có ≥2 chi phí ứng viên / tranh chấp → bỏ qua, khớp tay. */
  skippedAmbiguous: number;
  /** GD không tìm được chi phí nào khớp. */
  skippedNoMatch: number;
  /** Tổng GD tiền-ra chưa gắn đã quét. */
  totalUnlinkedTx: number;
  /** Tổng khoản chi tay chưa gắn. */
  totalUnlinkedExpense: number;
}

/** Preview (dry-run): gợi ý cặp tiền-ra ↔ chi phí tay theo số tiền + ngày. KHÔNG ghi. */
export const expenseReconcilePreview = async (): Promise<ExpenseReconcilePreviewResult> => {
  const res = await apiClient.post<ExpenseReconcilePreviewResult>(
    '/transactions/expense-reconcile/preview',
  );
  return res.data;
};

/** Apply: gắn danh sách cặp user đã confirm (BE atomic + idempotent). */
export const expenseReconcileApply = async (
  pairs: { transactionId: string; expenseId: string }[],
): Promise<{ applied: number; skipped: number }> => {
  const res = await apiClient.post<{ applied: number; skipped: number }>(
    '/transactions/expense-reconcile/apply',
    { pairs },
  );
  return res.data;
};

/** Khớp tay 1 GD tiền-ra với 1 khoản chi phí có sẵn. */
export const linkTransactionExpense = async (
  transactionId: string,
  expenseId: string,
): Promise<{ ok: boolean }> => {
  const res = await apiClient.post<{ ok: boolean }>(
    `/transactions/${transactionId}/expense-link`,
    { expenseId },
  );
  return res.data;
};

/** Bỏ khớp khoản chi khỏi 1 GD tiền-ra (quay lại tính OPEX auto). */
export const unlinkTransactionExpense = async (
  transactionId: string,
): Promise<{ unlinked: number }> => {
  const res = await apiClient.delete<{ unlinked: number }>(
    `/transactions/${transactionId}/expense-link`,
  );
  return res.data;
};
