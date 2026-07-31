import { apiClient } from '@/services/api/client';

/** 1 dòng NVL trong kho (số lượng theo đơn nhập từ mốc). Khớp inventory_overview. */
export interface InventoryItem {
  key: string;
  name: string;
  unit: string;
  qtyIn: number; // tổng số lượng đã nhập từ mốc
  amountIn: number; // VND
  receiptCount: number; // số lần nhập
  lastDate: string; // ISO yyyy-mm-dd
}

/** Tổng hợp tồn kho từ 1 mốc (mặc định 13/7). */
export interface InventoryOverview {
  from: string;
  materialCount: number;
  totalQtyLines: number;
  totalAmount: number; // VND
  items: InventoryItem[];
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

/** Lấy tồn kho NVL theo đơn nhập. from = 'yyyy-mm-dd' (mặc định 13/7). Type-guard mọi field. */
export const fetchInventory = async (from?: string): Promise<InventoryOverview> => {
  const res = await apiClient.get('/stock-receipts/inventory', {
    params: from ? { from } : undefined,
  });
  const d = (res.data ?? {}) as Record<string, any>;
  const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
  return {
    from: String(d.from ?? ''),
    materialCount: num(d.materialCount),
    totalQtyLines: num(d.totalQtyLines),
    totalAmount: num(d.totalAmount),
    items: arr(d.items).map((x) => ({
      key: String(x.key ?? ''),
      name: String(x.name ?? ''),
      unit: String(x.unit ?? ''),
      qtyIn: num(x.qtyIn),
      amountIn: num(x.amountIn),
      receiptCount: num(x.receiptCount),
      lastDate: String(x.lastDate ?? ''),
    })),
  };
};
