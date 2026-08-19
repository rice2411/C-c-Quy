import { apiClient } from '@/services/api/client';

/** Đơn vị vận chuyển (danh bạ đối tác giao hàng). */
export interface Carrier {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  active: boolean;
  sortOrder: number;
}

const BASE = '/carriers';

const toCarrier = (r: any): Carrier => ({
  id: typeof r?.id === 'string' ? r.id : '',
  name: typeof r?.name === 'string' ? r.name : '',
  phone: typeof r?.phone === 'string' ? r.phone : null,
  note: typeof r?.note === 'string' ? r.note : null,
  active: r?.active !== false,
  sortOrder: typeof r?.sortOrder === 'number' ? r.sortOrder : 100,
});

export const fetchCarriers = async (): Promise<Carrier[]> => {
  const { data } = await apiClient.get<any[]>(BASE);
  return Array.isArray(data) ? data.map(toCarrier).filter((c) => c.id) : [];
};

export const saveCarrier = async (input: {
  id?: string;
  name: string;
  phone?: string | null;
  note?: string | null;
  active?: boolean;
}): Promise<Carrier[]> => {
  const { data } = await apiClient.put<any[]>(BASE, input);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};

export const deleteCarrier = async (id: string): Promise<Carrier[]> => {
  const { data } = await apiClient.delete<any[]>(`${BASE}/${encodeURIComponent(id)}`);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};
