import { Order } from '@/types';
import { apiClient } from '@/services/api/client';

/**
 * Hoa hồng CTV — dữ liệu tính ở BE NestJS, FE gọi qua apiClient.
 * (Đồng nhất với các service khác: hàm gọi API nằm ngay trong service này.)
 */
export interface CollaboratorCommissionSummary {
  collaboratorUid: string;
  collaboratorName: string;
  /** Đơn hàng với commissionAmount đã được tính ở BE */
  orders: Order[];
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

/** Admin: thống kê hoa hồng tất cả CTV. */
export const fetchCommissionSummaries = async (): Promise<CollaboratorCommissionSummary[]> => {
  const { data } = await apiClient.get<CollaboratorCommissionSummary[]>('/commission/summaries');
  return data;
};

/** CTV: hoa hồng của chính mình. */
export const fetchMyCommission = async (): Promise<CollaboratorCommissionSummary> => {
  const { data } = await apiClient.get<CollaboratorCommissionSummary>('/commission/me');
  return data;
};

/** Đánh dấu các đơn đã trả hoa hồng. */
export const markCommissionPaid = async (orderIds: string[]): Promise<void> => {
  await apiClient.post('/commission/mark-paid', { orderIds });
};

/** Đặt lại các đơn về chưa trả. */
export const markCommissionPending = async (orderIds: string[]): Promise<void> => {
  await apiClient.post('/commission/mark-pending', { orderIds });
};
