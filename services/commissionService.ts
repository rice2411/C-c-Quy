import { Order } from '@/types';

/**
 * Tổng hợp hoa hồng theo từng CTV. Dữ liệu được tính ở BE và trả về qua
 * `@/services/api/commissionApi` (fetchCommissionSummariesApi / fetchMyCommissionApi).
 * File này chỉ còn giữ định nghĩa type dùng chung cho FE.
 */
export interface CollaboratorCommissionSummary {
  collaboratorUid: string;
  collaboratorName: string;
  /** Đơn hàng với commissionAmount đã được tính lại từ groups + products hiện tại */
  orders: Order[];
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}
