/**
 * Pure helpers tính stats sản phẩm từ orders.
 */
import type { Order, Product } from '@/types';

export interface ProductSalesMetric {
  productId: string;
  productName: string;
  orderCount: number;
  unitsSold: number;
  revenue: number;
  /** Đơn cuối cùng có sp này (ISO) */
  lastOrderAt?: string;
}

const isCountableStatus = (status: any): boolean => {
  const s = String(status ?? '').toUpperCase();
  return s !== 'CANCELLED' && s !== 'RETURNED';
};

const parseDate = (v: any): Date | null => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Tính metric mỗi sản phẩm từ orders. Filter bỏ đơn huỷ/trả.
 * Optional `sinceDays`: chỉ tính đơn trong N ngày gần (default: tất cả).
 */
export const computeProductMetrics = (
  orders: Order[],
  products: Product[],
  sinceDays?: number,
): Record<string, ProductSalesMetric> => {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const result: Record<string, ProductSalesMetric> = {};
  const threshold = sinceDays ? Date.now() - sinceDays * 86400000 : 0;

  for (const order of orders) {
    if (!isCountableStatus(order.status)) continue;
    const orderDate = parseDate(order.orderDate || order.date);
    if (sinceDays && orderDate && orderDate.getTime() < threshold) continue;

    for (const item of order.items || []) {
      const pid = item.productId;
      if (!pid) continue;
      const p = productMap.get(pid);
      if (!p) continue;

      if (!result[pid]) {
        result[pid] = {
          productId: pid,
          productName: p.name,
          orderCount: 0,
          unitsSold: 0,
          revenue: 0,
          lastOrderAt: undefined,
        };
      }
      const m = result[pid];
      m.orderCount += 1;
      m.unitsSold += item.quantity || 0;
      m.revenue += (item.price || 0) * (item.quantity || 0);

      if (orderDate) {
        const iso = orderDate.toISOString();
        if (!m.lastOrderAt || iso > m.lastOrderAt) m.lastOrderAt = iso;
      }
    }
  }
  return result;
};

export interface ProductAggregateStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  topSeller?: ProductSalesMetric;
  revenueThisMonth: number;
  avgMargin: number;
  warnings: {
    lowMargin: number;       // < 20% margin
    losing: number;          // price < cost
    stale: number;           // 60+ days no orders
    noCostPrice: number;     // costPrice not set
  };
}

export const computeAggregateStats = (
  products: Product[],
  metrics: Record<string, ProductSalesMetric>,
  ordersThisMonth?: Order[],
): ProductAggregateStats => {
  const active = products.filter((p) => p.status === 'active');
  const inactive = products.filter((p) => p.status === 'inactive');

  // Top seller
  const sortedByUnits = Object.values(metrics).sort((a, b) => b.unitsSold - a.unitsSold);
  const topSeller = sortedByUnits[0];

  // Revenue this month (from orders this month)
  let revenueThisMonth = 0;
  if (ordersThisMonth) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    for (const o of ordersThisMonth) {
      if (!isCountableStatus(o.status)) continue;
      const d = parseDate(o.orderDate || o.date);
      if (!d || d.getTime() < monthStart) continue;
      for (const it of o.items || []) {
        revenueThisMonth += (it.price || 0) * (it.quantity || 0);
      }
    }
  }

  // Avg margin (chỉ tính sp có costPrice + price > 0)
  const margins: number[] = [];
  let losing = 0;
  let lowMargin = 0;
  let noCostPrice = 0;
  for (const p of products) {
    if (!p.costPrice || p.costPrice <= 0) {
      noCostPrice += 1;
      continue;
    }
    if (!p.price || p.price <= 0) continue;
    const margin = (p.price - p.costPrice) / p.price;
    if (margin < 0) losing += 1;
    else if (margin < 0.2) lowMargin += 1;
    margins.push(margin);
  }
  const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;

  // Stale (60+ days)
  const sixtyAgo = Date.now() - 60 * 86400000;
  let stale = 0;
  for (const p of products) {
    if (p.status !== 'active') continue;
    const m = metrics[p.id];
    if (!m || !m.lastOrderAt) {
      stale += 1;
      continue;
    }
    if (new Date(m.lastOrderAt).getTime() < sixtyAgo) stale += 1;
  }

  return {
    totalProducts: products.length,
    activeProducts: active.length,
    inactiveProducts: inactive.length,
    topSeller,
    revenueThisMonth,
    avgMargin,
    warnings: { lowMargin, losing, stale, noCostPrice },
  };
};
