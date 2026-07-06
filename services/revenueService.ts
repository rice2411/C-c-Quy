import { apiClient } from '@/services/api/client';
import { Order } from '@/types';
import { Transaction } from '@/types';
import { OrderStatus } from '@/types/enums';
import { SavedStockReceiptSummary } from '@/types/billReceipt';

/* ───────────────────────── helpers thời gian ───────────────────────────── */
export const periodBounds = (fromISO: string, toISO: string): { from: Date; to: Date } => {
  const from = fromISO ? new Date(fromISO) : new Date(0);
  from.setHours(0, 0, 0, 0);
  const to = toISO ? new Date(toISO) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

const within = (dateStr: string | undefined | null, from: Date, to: Date): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime()) && d >= from && d <= to;
};

/** Đơn được tính doanh thu: không huỷ, không hoàn */
export const isRevenueOrder = (o: Order): boolean =>
  o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED;

const stockDate = (r: SavedStockReceiptSummary): string | undefined =>
  r.receiptDate ?? r.createdAt ?? undefined;

/* ───────────────────────── lọc theo kỳ (dùng lại ở các tab) ────────────── */
export const revenueOrdersInPeriod = (orders: Order[], fromISO: string, toISO: string): Order[] => {
  const { from, to } = periodBounds(fromISO, toISO);
  return orders.filter(o => isRevenueOrder(o) && within(o.deliveryDate, from, to));
};

export const stockReceiptsInPeriod = (
  receipts: SavedStockReceiptSummary[], fromISO: string, toISO: string,
): SavedStockReceiptSummary[] => {
  const { from, to } = periodBounds(fromISO, toISO);
  return receipts.filter(r => within(stockDate(r), from, to));
};

export const bankInInPeriod = (transactions: Transaction[], fromISO: string, toISO: string): Transaction[] => {
  const { from, to } = periodBounds(fromISO, toISO);
  return transactions.filter(tr => tr.transferType === 'in' && within(tr.transactionDate, from, to));
};

/* ───────────────────────── báo cáo P&L ─────────────────────────────────── */
export interface RevenuePoint {
  label: string;
  revenue: number;
  profit: number;
}

export interface RevenueReport {
  totalRevenue: number;
  orderCount: number;
  totalCommission: number;
  totalStockIn: number;
  totalCosts: number;
  profit: number;
  margin: number;
  bankIn: number;
  bankInDelta: number; // bankIn - totalRevenue (đối chiếu ngân hàng vs doanh thu đơn)
  bankOut: number; // VND — tiền ra (transactions transfer_type='out' trong kỳ)
  settledOut?: number; // VND — tiền ra đã kết toán (về TK chính), trung tính
  unclassifiedOut?: number; // VND — tiền ra chưa phân loại (cần xử lý)
  totalRefunded: number; // VND — tổng đã hoàn (order_refunds trong kỳ)
  netRevenue: number; // VND — doanh thu thuần = totalRevenue − totalRefunded
  series: RevenuePoint[];
  costBreakdown: { stockIn: number; commission: number };
}

/**
 * Lấy báo cáo doanh thu (P&L) từ BE NestJS — BE tự fetch mọi nguồn & tính,
 * FE chỉ cần gọi 1 API. Thay cho việc fetch nhiều nguồn rồi computeRevenueReport.
 */
export const fetchRevenueReport = async (fromISO: string, toISO: string): Promise<RevenueReport> => {
  const res = await apiClient.get<RevenueReport>('/revenue/report', {
    params: { from: fromISO, to: toISO },
  });
  return res.data;
};
