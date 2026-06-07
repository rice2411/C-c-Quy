import { apiClient } from '@/services/api/client';
import { Order } from '@/types';
import { Transaction } from '@/types';
import { OrderStatus } from '@/types/enums';
import { SavedStockReceiptSummary } from '@/types/billReceipt';
import { Expense } from '@/types/expense';

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

export const expensesInPeriod = (expenses: Expense[], fromISO: string, toISO: string): Expense[] => {
  const { from, to } = periodBounds(fromISO, toISO);
  return expenses.filter(e => within(e.date, from, to));
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
  totalExpenses: number;
  totalCosts: number;
  profit: number;
  margin: number;
  bankIn: number;
  bankInDelta: number; // bankIn - totalRevenue (đối chiếu ngân hàng vs doanh thu đơn)
  series: RevenuePoint[];
  costBreakdown: { stockIn: number; commission: number; expenses: number };
}

export interface RevenueReportInput {
  /** Tất cả đơn (cơ sở doanh thu) */
  orders: Order[];
  /** Đơn của CTV đã enrich commissionAmount (từ buildFullCommissionSummary) */
  commissionOrders: Order[];
  stockReceipts: SavedStockReceiptSummary[];
  expenses: Expense[];
  transactions: Transaction[];
  fromISO: string;
  toISO: string;
}

const buildSeries = (
  fromISO: string,
  toISO: string,
  revOrders: Order[],
  commissionOrders: Order[],
  stockReceipts: SavedStockReceiptSummary[],
  expenses: Expense[],
): RevenuePoint[] => {
  const { from, to } = periodBounds(fromISO, toISO);
  const diffDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const bucketDays = diffDays <= 31 ? 1 : diffDays <= 90 ? 7 : 30;
  const count = Math.max(1, Math.ceil(diffDays / bucketDays));
  const idxOf = (d: Date) => Math.floor((d.getTime() - from.getTime()) / (bucketDays * 86_400_000));

  const revenue = new Array(count).fill(0);
  const cost = new Array(count).fill(0);

  const addCost = (dateStr: string | undefined, amount: number) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()) || d < from || d > to) return;
    const i = idxOf(d);
    if (i >= 0 && i < count) cost[i] += amount;
  };

  revOrders.forEach(o => {
    const d = o.deliveryDate ? new Date(o.deliveryDate) : null;
    if (!d || Number.isNaN(d.getTime())) return;
    const i = idxOf(d);
    if (i >= 0 && i < count) revenue[i] += o.total ?? 0;
  });
  commissionOrders.forEach(o => {
    if (!isRevenueOrder(o)) return;
    addCost(o.deliveryDate, o.commissionAmount ?? 0);
  });
  stockReceipts.forEach(r => addCost(stockDate(r), r.totalAmount ?? 0));
  expenses.forEach(e => addCost(e.date, e.amount ?? 0));

  return Array.from({ length: count }, (_, i) => {
    const bucketStart = new Date(from.getTime() + i * bucketDays * 86_400_000);
    return {
      label: `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`,
      revenue: revenue[i],
      profit: revenue[i] - cost[i],
    };
  });
};

export const computeRevenueReport = (input: RevenueReportInput): RevenueReport => {
  const { orders, commissionOrders, stockReceipts, expenses, transactions, fromISO, toISO } = input;
  const { from, to } = periodBounds(fromISO, toISO);

  const revOrders = orders.filter(o => isRevenueOrder(o) && within(o.deliveryDate, from, to));
  const totalRevenue = revOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  const totalCommission = commissionOrders
    .filter(o => isRevenueOrder(o) && within(o.deliveryDate, from, to))
    .reduce((s, o) => s + (o.commissionAmount ?? 0), 0);

  const totalStockIn = stockReceipts
    .filter(r => within(stockDate(r), from, to))
    .reduce((s, r) => s + (r.totalAmount ?? 0), 0);

  const totalExpenses = expenses
    .filter(e => within(e.date, from, to))
    .reduce((s, e) => s + (e.amount ?? 0), 0);

  const totalCosts = totalCommission + totalStockIn + totalExpenses;
  const profit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? profit / totalRevenue : 0;

  const bankIn = transactions
    .filter(tr => tr.transferType === 'in' && within(tr.transactionDate, from, to))
    .reduce((s, tr) => s + (tr.transferAmount ?? 0), 0);

  return {
    totalRevenue,
    orderCount: revOrders.length,
    totalCommission,
    totalStockIn,
    totalExpenses,
    totalCosts,
    profit,
    margin,
    bankIn,
    bankInDelta: bankIn - totalRevenue,
    series: buildSeries(fromISO, toISO, revOrders, commissionOrders, stockReceipts, expenses),
    costBreakdown: { stockIn: totalStockIn, commission: totalCommission, expenses: totalExpenses },
  };
};

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
