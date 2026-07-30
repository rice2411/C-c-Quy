import { apiClient } from '@/services/api/client';

/** Số liệu tổng hợp cho trang Phân tích (khớp stored function analytics_overview). */
export interface AnalyticsOverview {
  kpi: {
    orders: number;
    revenue: number;
    aov: number;
    shipProvinceOrders: number;
    shipOrders: number;
    pickupOrders: number;
    deliveredOrders: number;
    paidRevenue: number;
  };
  deliveryType: { type: string; orders: number; revenue: number }[];
  byMonth: { month: string; orders: number; revenue: number }[];
  byDow: { dow: number; orders: number; revenue: number }[];
  statusBreakdown: { status: string; orders: number }[];
  paymentBreakdown: { status: string; orders: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  shipTimeliness: {
    count: number;
    avgDelta: number;
    early: number;
    onTime: number;
    late: number;
    maxLate: number;
    orders: { orderNumber: string; needDate: string; deliveredDate: string; delta: number }[];
  };
  generatedAt: string;
}

/** Nhận định AI (khớp prompt analytics-insight). */
export interface AnalyticsInsight {
  summary?: string;
  highlights?: string[];
  trends?: string[];
  delivery?: string[];
  products?: string[];
  risks?: string[];
  actions?: string[];
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

/** Lấy số liệu tổng hợp (rule-based, không AI). Type-guard mọi field. */
export const fetchAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const res = await apiClient.get('/analytics/overview');
  const d = (res.data ?? {}) as Record<string, any>;
  const k = (d.kpi ?? {}) as Record<string, unknown>;
  const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
  return {
    kpi: {
      orders: num(k.orders),
      revenue: num(k.revenue),
      aov: num(k.aov),
      shipProvinceOrders: num(k.shipProvinceOrders),
      shipOrders: num(k.shipOrders),
      pickupOrders: num(k.pickupOrders),
      deliveredOrders: num(k.deliveredOrders),
      paidRevenue: num(k.paidRevenue),
    },
    deliveryType: arr(d.deliveryType).map((x) => ({ type: String(x.type ?? ''), orders: num(x.orders), revenue: num(x.revenue) })),
    byMonth: arr(d.byMonth).map((x) => ({ month: String(x.month ?? ''), orders: num(x.orders), revenue: num(x.revenue) })),
    byDow: arr(d.byDow).map((x) => ({ dow: num(x.dow), orders: num(x.orders), revenue: num(x.revenue) })),
    statusBreakdown: arr(d.statusBreakdown).map((x) => ({ status: String(x.status ?? ''), orders: num(x.orders) })),
    paymentBreakdown: arr(d.paymentBreakdown).map((x) => ({ status: String(x.status ?? ''), orders: num(x.orders) })),
    topProducts: arr(d.topProducts).map((x) => ({ name: String(x.name ?? ''), qty: num(x.qty), revenue: num(x.revenue) })),
    shipTimeliness: {
      count: num(d.shipTimeliness?.count),
      avgDelta: num(d.shipTimeliness?.avgDelta),
      early: num(d.shipTimeliness?.early),
      onTime: num(d.shipTimeliness?.onTime),
      late: num(d.shipTimeliness?.late),
      maxLate: num(d.shipTimeliness?.maxLate),
      orders: arr(d.shipTimeliness?.orders).map((x) => ({
        orderNumber: String(x.order_number ?? ''),
        needDate: String(x.need_date ?? ''),
        deliveredDate: String(x.delivered_date ?? ''),
        delta: num(x.delta),
      })),
    },
    generatedAt: String(d.generatedAt ?? ''),
  };
};

/** Nhờ Claude AI phân tích — CHỈ gọi khi user bấm nút (tốn credit). */
export const fetchAnalyticsInsight = async (overview: AnalyticsOverview): Promise<AnalyticsInsight> => {
  const res = await apiClient.post('/analytics/insight', { overview });
  const ins = (res.data as { insight?: unknown })?.insight;
  return (ins ?? {}) as AnalyticsInsight;
};
