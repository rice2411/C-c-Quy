import { apiClient } from '@/services/api/client';

/** Số liệu tổng hợp cho trang Phân tích — GỘP từ các endpoint analytics theo domain. */
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
  shipDuration: {
    count: number;
    avgDays: number;
    minDays: number;
    maxDays: number;
    orders: { orderNumber: string; shippedDate: string; deliveredDate: string; days: number }[];
  };
  /** Đơn tỉnh gộp theo tỉnh/thành: số đơn, số đã giao, TB ngày giao (null nếu chưa có mốc). */
  shipByProvince: { province: string; orders: number; delivered: number; avgDays: number | null }[];
  /** Doanh thu theo tỉnh (ship tỉnh). */
  provinceSales: { province: string; orders: number; revenue: number; aov: number; shipAvg: number }[];
  /** Khách hàng: mới vs quay lại + top khách. */
  customers: {
    total: number; returning: number; newCount: number;
    top: { name: string; orders: number; revenue: number; lastOrder: string }[];
  };
  /** Công nợ: đơn chưa thu đủ + tuổi nợ + danh sách. */
  receivables: {
    count: number; remaining: number;
    aging: { d0_7: number; d8_14: number; d15_30: number; d30p: number };
    orders: { orderNumber: string; customerName: string; total: number; paidAmount: number; remaining: number; ageDays: number; paymentStatus: string }[];
  };
  /** Vận hành giao SPX: trạng thái + histogram + đơn kẹt. */
  shipOps: {
    trackingStatus: { status: string; n: number }[];
    histogram: { d1: number; d2: number; d3: number; d4: number; d5p: number };
    stuck: { orderNumber: string; customerName: string; shippedDate: string; ageDays: number }[];
  };
  /** Cộng tác viên: đơn + doanh thu theo người tạo. */
  collaborators: { name: string; orders: number; revenue: number }[];
  /** P&L theo tháng: doanh thu − NVL − OPEX − hoàn = lãi. */
  pnlMonthly: { month: string; revenue: number; refund: number; material: number; opex: number }[];
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

/** Kỳ phân tích: from/to là ISO date (YYYY-MM-DD). Bỏ trống = toàn bộ lịch sử. */
export interface AnalyticsRange {
  from?: string;
  to?: string;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);

/** Chỉ đính kèm from/to khi có giá trị → endpoint tự hiểu "toàn bộ" khi thiếu. */
const rangeParams = (range?: AnalyticsRange): Record<string, string> => {
  const p: Record<string, string> = {};
  if (range?.from) p.from = range.from;
  if (range?.to) p.to = range.to;
  return p;
};

// ── Type-guard từng lát dữ liệu (coi mọi field là untrusted) ──────────────

const parseOrders = (d: Record<string, any>): Pick<
  AnalyticsOverview,
  'kpi' | 'deliveryType' | 'byMonth' | 'byDow' | 'statusBreakdown' | 'paymentBreakdown' | 'shipDuration' | 'shipByProvince' | 'provinceSales' | 'shipOps'
> => {
  const k = (d.kpi ?? {}) as Record<string, unknown>;
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
    shipDuration: {
      count: num(d.shipDuration?.count),
      avgDays: num(d.shipDuration?.avgDays),
      minDays: num(d.shipDuration?.minDays),
      maxDays: num(d.shipDuration?.maxDays),
      orders: arr(d.shipDuration?.orders).map((x) => ({
        orderNumber: String(x.order_number ?? ''),
        shippedDate: String(x.shipped_date ?? ''),
        deliveredDate: String(x.delivered_date ?? ''),
        days: num(x.days),
      })),
    },
    shipByProvince: arr(d.shipByProvince).map((x) => ({
      province: String(x.province ?? ''),
      orders: num(x.orders),
      delivered: num(x.delivered),
      avgDays: x.avg_days === null || x.avg_days === undefined ? null : num(x.avg_days),
    })),
    provinceSales: arr(d.provinceSales).map((x) => ({
      province: String(x.province ?? ''), orders: num(x.orders), revenue: num(x.revenue),
      aov: num(x.aov), shipAvg: num(x.ship_avg),
    })),
    shipOps: {
      trackingStatus: arr(d.shipOps?.trackingStatus).map((x) => ({ status: String(x.status ?? ''), n: num(x.n) })),
      histogram: {
        d1: num(d.shipOps?.histogram?.d1), d2: num(d.shipOps?.histogram?.d2), d3: num(d.shipOps?.histogram?.d3),
        d4: num(d.shipOps?.histogram?.d4), d5p: num(d.shipOps?.histogram?.d5p),
      },
      stuck: arr(d.shipOps?.stuck).map((x) => ({
        orderNumber: String(x.order_number ?? ''), customerName: String(x.customer_name ?? ''),
        shippedDate: String(x.shipped_date ?? ''), ageDays: num(x.age_days),
      })),
    },
  };
};

const parseProducts = (d: Record<string, any>): Pick<AnalyticsOverview, 'topProducts'> => ({
  topProducts: arr(d.topProducts).map((x) => ({ name: String(x.name ?? ''), qty: num(x.qty), revenue: num(x.revenue) })),
});

const parseCustomers = (d: Record<string, any>): Pick<AnalyticsOverview, 'customers' | 'receivables'> => ({
  customers: {
    total: num(d.customers?.total), returning: num(d.customers?.returning), newCount: num(d.customers?.newCount),
    top: arr(d.customers?.top).map((x) => ({
      name: String(x.name ?? ''), orders: num(x.orders), revenue: num(x.revenue), lastOrder: String(x.last_order ?? ''),
    })),
  },
  receivables: {
    count: num(d.receivables?.count), remaining: num(d.receivables?.remaining),
    aging: {
      d0_7: num(d.receivables?.aging?.d0_7), d8_14: num(d.receivables?.aging?.d8_14),
      d15_30: num(d.receivables?.aging?.d15_30), d30p: num(d.receivables?.aging?.d30p),
    },
    orders: arr(d.receivables?.orders).map((x) => ({
      orderNumber: String(x.order_number ?? ''), customerName: String(x.customer_name ?? ''),
      total: num(x.total), paidAmount: num(x.paid_amount), remaining: num(x.remaining),
      ageDays: num(x.age_days), paymentStatus: String(x.payment_status ?? ''),
    })),
  },
});

const parseCommission = (d: Record<string, any>): Pick<AnalyticsOverview, 'collaborators'> => ({
  collaborators: arr(d.collaborators).map((x) => ({ name: String(x.name ?? ''), orders: num(x.orders), revenue: num(x.revenue) })),
});

const parseRevenue = (d: Record<string, any>): Pick<AnalyticsOverview, 'pnlMonthly'> => ({
  pnlMonthly: arr(d.pnlMonthly).map((x) => ({
    month: String(x.month ?? ''), revenue: num(x.revenue), refund: num(x.refund), material: num(x.material), opex: num(x.opex),
  })),
});

/**
 * Lấy số liệu tổng hợp (rule-based, không AI) — gọi SONG SONG 5 endpoint analytics
 * theo domain rồi gộp lại thành 1 AnalyticsOverview. Type-guard mọi field.
 */
export const fetchAnalyticsOverview = async (range?: AnalyticsRange): Promise<AnalyticsOverview> => {
  const params = rangeParams(range);
  const get = (path: string) => apiClient.get(path, { params }).then((r) => (r.data ?? {}) as Record<string, any>);
  const [orders, products, customers, commission, revenue] = await Promise.all([
    get('/orders/analytics'),
    get('/products/analytics'),
    get('/customers/analytics'),
    get('/commission/analytics'),
    get('/revenue/analytics'),
  ]);
  return {
    ...parseOrders(orders),
    ...parseProducts(products),
    ...parseCustomers(customers),
    ...parseCommission(commission),
    ...parseRevenue(revenue),
    generatedAt: String(orders.generatedAt ?? ''),
  };
};

/** Nhờ Claude AI phân tích — CHỈ gọi khi user bấm nút (tốn credit). */
export const fetchAnalyticsInsight = async (overview: AnalyticsOverview): Promise<AnalyticsInsight> => {
  const res = await apiClient.post('/analytics/insight', { overview });
  const ins = (res.data as { insight?: unknown })?.insight;
  return (ins ?? {}) as AnalyticsInsight;
};
