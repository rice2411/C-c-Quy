/**
 * Coach service — danh bạ nhà xe qua BE NestJS (GET/PUT /coaches).
 * BE lưu bảng `coaches`, save-all (ghi đè toàn bộ danh sách).
 */
import { apiClient } from '@/services/api/client';
import type { Coach } from '@/types/coach';

/** Type-guard 1 bản ghi coach từ API (coi dữ liệu là untrusted). */
const toCoach = (r: any): Coach => ({
  id: typeof r?.id === 'string' ? r.id : '',
  name: typeof r?.name === 'string' ? r.name : '',
  phone: typeof r?.phone === 'string' ? r.phone : undefined,
  route: typeof r?.route === 'string' ? r.route : undefined,
  pickupPoint: typeof r?.pickupPoint === 'string' ? r.pickupPoint : undefined,
  defaultFee: typeof r?.defaultFee === 'number' ? r.defaultFee : 0,
  note: typeof r?.note === 'string' ? r.note : undefined,
  sortOrder: typeof r?.sortOrder === 'number' ? r.sortOrder : 0,
});

export const fetchCoaches = async (): Promise<Coach[]> => {
  const { data } = await apiClient.get<Coach[]>('/coaches');
  return Array.isArray(data) ? data.map(toCoach).filter((c) => c.id) : [];
};

export const saveCoaches = async (coaches: Coach[]): Promise<Coach[]> => {
  const { data } = await apiClient.put<Coach[]>('/coaches', coaches);
  return Array.isArray(data) ? data.map(toCoach).filter((c) => c.id) : [];
};
