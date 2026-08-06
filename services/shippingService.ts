import { apiClient } from '@/services/api/client';

/** Chỉ số 1 đơn vị vận chuyển (DVVC). */
export interface CarrierStat {
  carrier: string;
  orders: number;
  revenue: number;
  aov: number;
  shipAvg: number;
  delivered: number;
  inTransit: number;
  stuck: number;
  durCount: number;
  avgDays: number;
  minDays: number;
  maxDays: number;
  histogram: { d1: number; d2: number; d3: number; d4: number; d5p: number };
}

/** Đơn kẹt (đã gửi ≥4 ngày, chưa có mốc giao). */
export interface StuckOrder {
  carrier: string;
  orderNumber: string;
  customerName: string;
  shippedDate: string;
  ageDays: number;
}

/** Phân bố theo tỉnh của 1 DVVC. */
export interface CarrierProvince {
  carrier: string;
  province: string;
  orders: number;
  delivered: number;
  avgDays: number | null;
}

/** Số liệu trang Vận chuyển (khớp stored function shipping_analytics). */
export interface ShippingAnalytics {
  carriers: CarrierStat[];
  stuckOrders: StuckOrder[];
  byProvince: CarrierProvince[];
  generatedAt: string;
}

/** Kỳ thống kê: from/to ISO date (YYYY-MM-DD). Bỏ trống = toàn bộ lịch sử. */
export interface ShippingRange {
  from?: string;
  to?: string;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);

/** Lấy chỉ số theo DVVC trong kỳ. Type-guard mọi field (dữ liệu API là untrusted). */
export const fetchShippingAnalytics = async (range?: ShippingRange): Promise<ShippingAnalytics> => {
  const params: Record<string, string> = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;
  const res = await apiClient.get('/shipping/analytics', { params });
  const d = (res.data ?? {}) as Record<string, any>;
  return {
    carriers: arr(d.carriers).map((c) => ({
      carrier: String(c.carrier ?? ''),
      orders: num(c.orders),
      revenue: num(c.revenue),
      aov: num(c.aov),
      shipAvg: num(c.ship_avg),
      delivered: num(c.delivered),
      inTransit: num(c.in_transit),
      stuck: num(c.stuck),
      durCount: num(c.dur_count),
      avgDays: num(c.avg_days),
      minDays: num(c.min_days),
      maxDays: num(c.max_days),
      histogram: {
        d1: num(c.histogram?.d1), d2: num(c.histogram?.d2), d3: num(c.histogram?.d3),
        d4: num(c.histogram?.d4), d5p: num(c.histogram?.d5p),
      },
    })),
    stuckOrders: arr(d.stuckOrders).map((o) => ({
      carrier: String(o.carrier ?? ''),
      orderNumber: String(o.order_number ?? ''),
      customerName: String(o.customer_name ?? ''),
      shippedDate: String(o.shipped_date ?? ''),
      ageDays: num(o.age_days),
    })),
    byProvince: arr(d.byProvince).map((p) => ({
      carrier: String(p.carrier ?? ''),
      province: String(p.province ?? ''),
      orders: num(p.orders),
      delivered: num(p.delivered),
      avgDays: p.avg_days === null || p.avg_days === undefined ? null : num(p.avg_days),
    })),
    generatedAt: String(d.generatedAt ?? ''),
  };
};
