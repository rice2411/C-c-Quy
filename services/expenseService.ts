import { apiClient } from '@/services/api/client';
import { Expense } from '@/types/expense';

const PATH = '/expenses';

export const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await apiClient.get<Expense[]>(PATH);
  return res.data;
};

export const addExpense = async (
  data: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> => {
  const res = await apiClient.post<{ id: string }>(PATH, data);
  return { id: res.data.id, ...data };
};

export const updateExpense = async (
  id: string,
  data: Partial<Omit<Expense, 'id'>>,
): Promise<void> => {
  await apiClient.patch(`${PATH}/${id}`, data);
};

export const deleteExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`${PATH}/${id}`);
};
