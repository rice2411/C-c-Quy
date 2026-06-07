/**
 * Commission group service — CRUD nhóm hoa hồng qua BE NestJS
 * (envelope `.data` đã được apiClient bóc sẵn). Collection 'commissionGroups'.
 * BE tự seed DEFAULT_COMMISSION_GROUPS khi collection rỗng.
 */

import { apiClient } from '@/services/api/client';
import { CommissionGroup } from '@/types/commissionGroup';

/** Lấy danh sách nhóm hoa hồng (BE seed defaults nếu chưa có). */
export const fetchCommissionGroups = async (): Promise<CommissionGroup[]> => {
  const res = await apiClient.get<CommissionGroup[]>('/commission-groups');
  return res.data;
};

/** Tạo nhóm mới */
export const createCommissionGroup = async (
  data: Omit<CommissionGroup, 'id'>,
): Promise<CommissionGroup> => {
  const res = await apiClient.post<CommissionGroup>('/commission-groups', data);
  return res.data;
};

/** Cập nhật nhóm */
export const updateCommissionGroup = async (
  id: string,
  data: Partial<Omit<CommissionGroup, 'id'>>,
): Promise<void> => {
  await apiClient.patch(`/commission-groups/${id}`, data);
};

/** Xoá nhóm */
export const deleteCommissionGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/commission-groups/${id}`);
};
