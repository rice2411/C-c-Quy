import { apiClient } from '@/services/api/client';
import { Role } from '@/types/user';

const BASE = '/configurations/roles';

const toRole = (r: any): Role => ({
  key: typeof r?.key === 'string' ? r.key : '',
  name: typeof r?.name === 'string' ? r.name : '',
  sortOrder: typeof r?.sortOrder === 'number' ? r.sortOrder : 100,
  builtIn: r?.builtIn === true,
});

/** Danh sách vai trò (động). */
export const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await apiClient.get<any[]>(BASE);
  return Array.isArray(data) ? data.map(toRole).filter((r) => r.key) : [];
};

/** Thêm/sửa vai trò → trả danh sách sau lưu. key mới bỏ trống → BE tự slug từ name. */
export const saveRole = async (input: {
  key?: string;
  name: string;
  sortOrder?: number;
}): Promise<Role[]> => {
  const { data } = await apiClient.put<any[]>(BASE, input);
  return Array.isArray(data) ? data.map(toRole) : [];
};

/** Xoá vai trò theo key → trả danh sách sau xoá. */
export const deleteRole = async (key: string): Promise<Role[]> => {
  const { data } = await apiClient.delete<any[]>(`${BASE}/${encodeURIComponent(key)}`);
  return Array.isArray(data) ? data.map(toRole) : [];
};
