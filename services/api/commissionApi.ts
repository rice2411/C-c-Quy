import { apiClient } from './client';
import { CollaboratorCommissionSummary } from '@/services/commissionService';

/**
 * Gọi BE NestJS cho domain hoa hồng (thay cho buildFullCommissionSummary /
 * buildMyCommissionSummary / markCommissionPaid... khi đã bật VITE_API_URL).
 */

export const fetchCommissionSummariesApi = async (): Promise<CollaboratorCommissionSummary[]> => {
  const { data } = await apiClient.get<CollaboratorCommissionSummary[]>('/commission/summaries');
  return data;
};

export const fetchMyCommissionApi = async (): Promise<CollaboratorCommissionSummary> => {
  const { data } = await apiClient.get<CollaboratorCommissionSummary>('/commission/me');
  return data;
};

export const markCommissionPaidApi = async (orderIds: string[]): Promise<void> => {
  await apiClient.post('/commission/mark-paid', { orderIds });
};

export const markCommissionPendingApi = async (orderIds: string[]): Promise<void> => {
  await apiClient.post('/commission/mark-pending', { orderIds });
};
