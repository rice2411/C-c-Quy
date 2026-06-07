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

/** Liên kết giao dịch với 1 đơn: ghi orderNumber xuống transaction để khớp đối soát.
 *  Truyền orderNumber rỗng để gỡ liên kết. */
export const linkTransactionOrder = async (
  transactionId: string,
  orderNumber: string,
): Promise<void> => {
  await apiClient.patch(`/transactions/${transactionId}/link`, { orderNumber });
};

export const fetchTransactionsByOrderNumber = async (
  orderNumber: string,
): Promise<Transaction[]> => {
  const res = await apiClient.get<Transaction[]>('/transactions/by-order', {
    params: { orderNumber },
  });
  return res.data;
};
