import { apiClient } from '@/services/api/client';

/** Dạng ĐVVC: express = truyền thống (SPX/J&T…), coach = gửi xe khách (nhà xe). */
export type CarrierType = 'express' | 'coach';

/** Đơn vị vận chuyển (danh bạ đối tác giao hàng). */
export interface Carrier {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  type: CarrierType;
  route: string | null;   // tuyến (xe khách)
  station: string | null; // bến đỗ / điểm gửi-nhận (xe khách)
  active: boolean;
  sortOrder: number;
  /** Số đơn (chưa huỷ) đã gửi qua hãng này — chỉ đọc (BE tính). */
  orderCount: number;
}

const BASE = '/carriers';

const toCarrier = (r: any): Carrier => ({
  id: typeof r?.id === 'string' ? r.id : '',
  name: typeof r?.name === 'string' ? r.name : '',
  phone: typeof r?.phone === 'string' ? r.phone : null,
  note: typeof r?.note === 'string' ? r.note : null,
  type: r?.type === 'coach' ? 'coach' : 'express',
  route: typeof r?.route === 'string' ? r.route : null,
  station: typeof r?.station === 'string' ? r.station : null,
  active: r?.active !== false,
  sortOrder: typeof r?.sortOrder === 'number' ? r.sortOrder : 100,
  orderCount: typeof r?.orderCount === 'number' ? r.orderCount : 0,
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
  type?: CarrierType;
  route?: string | null;
  station?: string | null;
  active?: boolean;
}): Promise<Carrier[]> => {
  const { data } = await apiClient.put<any[]>(BASE, input);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};

export const deleteCarrier = async (id: string): Promise<Carrier[]> => {
  const { data } = await apiClient.delete<any[]>(`${BASE}/${encodeURIComponent(id)}`);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};
