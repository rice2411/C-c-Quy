import { apiClient } from '@/services/api/client';
import { ManualExpense } from '@/types';

/** Danh sách chi phí thủ công. */
export const fetchManualExpenses = async (): Promise<ManualExpense[]> => {
  const res = await apiClient.get<ManualExpense[]>('/manual-expenses');
  return Array.isArray(res.data) ? res.data : [];
};

/** Tạo/sửa chi phí thủ công (có id → sửa). */
export const upsertManualExpense = async (
  body: Omit<ManualExpense, 'id' | 'createdAt'> & { id?: string },
): Promise<ManualExpense> => {
  const res = await apiClient.post<ManualExpense>('/manual-expenses', body);
  return res.data;
};

/** Xoá chi phí thủ công. */
export const deleteManualExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`/manual-expenses/${id}`);
};
