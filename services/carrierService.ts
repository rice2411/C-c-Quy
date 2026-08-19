import { apiClient } from '@/services/api/client';

/** Dạng ĐVVC: express = truyền thống (SPX/J&T…), coach = gửi xe khách (nhà xe). */
export type CarrierType = 'express' | 'coach';

/** Văn phòng gửi/nhận của nhà xe (coach). */
export interface CarrierOffice {
  name?: string;      // tên VP (vd "VP1", "VP Hà Đông")
  address: string;    // địa chỉ
  landmark?: string;  // mốc gần (vd "Gần bến xe Mỹ Đình")
  phone?: string;
}

/** Tuyến chạy của nhà xe (coach) — mỗi tuyến giá/giờ riêng. */
export interface CarrierRoute {
  from: string;        // điểm đi (vd "Huế")
  to: string;          // điểm đến (vd "Hải Phòng")
  price?: number;      // giá gửi (VND)
  departTime?: string; // giờ chạy (vd "17h")
  arriveTime?: string; // giờ tới (vd "5h sáng")
  note?: string;
}

/** Đơn vị vận chuyển (danh bạ đối tác giao hàng). */
export interface Carrier {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  type: CarrierType;
  route: string | null;   // tuyến (xe khách) — legacy 1 dòng
  station: string | null; // bến đỗ / điểm gửi-nhận (xe khách) — legacy 1 dòng
  offices: CarrierOffice[]; // văn phòng gửi/nhận (xe khách)
  routes: CarrierRoute[];   // tuyến chạy (xe khách)
  active: boolean;
  sortOrder: number;
  /** Số đơn (chưa huỷ) đã gửi qua hãng này — chỉ đọc (BE tính). */
  orderCount: number;
  /** Phân bố tỉnh đích đã ship qua hãng — chỉ đọc (BE tính). */
  provinces: { province: string; count: number }[];
}

const BASE = '/carriers';

const toOffice = (o: any): CarrierOffice => ({
  name: typeof o?.name === 'string' ? o.name : undefined,
  address: typeof o?.address === 'string' ? o.address : '',
  landmark: typeof o?.landmark === 'string' ? o.landmark : undefined,
  phone: typeof o?.phone === 'string' ? o.phone : undefined,
});

const toRoute = (r: any): CarrierRoute => ({
  from: typeof r?.from === 'string' ? r.from : '',
  to: typeof r?.to === 'string' ? r.to : '',
  price: typeof r?.price === 'number' ? r.price : undefined,
  departTime: typeof r?.departTime === 'string' ? r.departTime : undefined,
  arriveTime: typeof r?.arriveTime === 'string' ? r.arriveTime : undefined,
  note: typeof r?.note === 'string' ? r.note : undefined,
});

const toCarrier = (r: any): Carrier => ({
  id: typeof r?.id === 'string' ? r.id : '',
  name: typeof r?.name === 'string' ? r.name : '',
  phone: typeof r?.phone === 'string' ? r.phone : null,
  note: typeof r?.note === 'string' ? r.note : null,
  type: r?.type === 'coach' ? 'coach' : 'express',
  route: typeof r?.route === 'string' ? r.route : null,
  station: typeof r?.station === 'string' ? r.station : null,
  offices: Array.isArray(r?.offices) ? r.offices.map(toOffice) : [],
  routes: Array.isArray(r?.routes) ? r.routes.map(toRoute) : [],
  active: r?.active !== false,
  sortOrder: typeof r?.sortOrder === 'number' ? r.sortOrder : 100,
  orderCount: typeof r?.orderCount === 'number' ? r.orderCount : 0,
  provinces: Array.isArray(r?.provinces)
    ? r.provinces
        .map((p: any) => ({ province: typeof p?.province === 'string' ? p.province : 'Khác', count: typeof p?.count === 'number' ? p.count : 0 }))
        .filter((p: { count: number }) => p.count > 0)
    : [],
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
  offices?: CarrierOffice[];
  routes?: CarrierRoute[];
  active?: boolean;
}): Promise<Carrier[]> => {
  const { data } = await apiClient.put<any[]>(BASE, input);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};

export const deleteCarrier = async (id: string): Promise<Carrier[]> => {
  const { data } = await apiClient.delete<any[]>(`${BASE}/${encodeURIComponent(id)}`);
  return Array.isArray(data) ? data.map(toCarrier) : [];
};
