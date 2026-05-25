/**
 * Nhóm hoa hồng dựa trên biên lợi nhuận (margin).
 *
 * Công thức:
 *   Khi có costPrice : commission = (price - costPrice) × profitShareRate × quantity
 *   Fallback         : commission = price × fallbackRate × quantity
 */
export interface CommissionGroup {
  id: string;
  name: string;
  /** Margin tối thiểu (0–1), inclusive */
  minMargin: number;
  /** Margin tối đa (0–1), exclusive (trừ nhóm cuối cùng) */
  maxMargin: number;
  /** Tỷ lệ chia sẻ lợi nhuận (0–1), VD 0.20 = 20% của (P-C) */
  profitShareRate: number;
  /** Fallback khi không có costPrice: % trên giá bán (0–1) */
  fallbackRate: number;
  /** Thứ tự hiển thị / so sánh */
  order: number;
}

export const DEFAULT_COMMISSION_GROUPS: Omit<CommissionGroup, 'id'>[] = [
  { name: 'Cơ bản',    minMargin: 0,    maxMargin: 0.25, profitShareRate: 0.15, fallbackRate: 0.03, order: 1 },
  { name: 'Trung bình', minMargin: 0.25, maxMargin: 0.45, profitShareRate: 0.20, fallbackRate: 0.05, order: 2 },
  { name: 'Tốt',       minMargin: 0.45, maxMargin: 0.65, profitShareRate: 0.25, fallbackRate: 0.08, order: 3 },
  { name: 'Cao cấp',   minMargin: 0.65, maxMargin: 1,    profitShareRate: 0.30, fallbackRate: 0.10, order: 4 },
];

/**
 * Tìm nhóm phù hợp với margin của sản phẩm.
 * Nhóm cuối (maxMargin = 1) bắt tất cả giá trị >= minMargin.
 */
export function findGroupForMargin(
  margin: number,
  groups: CommissionGroup[],
): CommissionGroup | undefined {
  const sorted = [...groups].sort((a, b) => a.order - b.order);
  return (
    sorted.find(g => margin >= g.minMargin && (margin < g.maxMargin || g.maxMargin >= 1)) ??
    sorted[sorted.length - 1]
  );
}

/**
 * Tính hoa hồng cho 1 đơn vị sản phẩm.
 * Trả về số tiền hoa hồng / sp (chưa nhân quantity).
 */
export function calcItemCommission(
  price: number,
  costPrice: number | undefined,
  groups: CommissionGroup[],
): number {
  if (!price || price <= 0 || groups.length === 0) return 0;

  if (costPrice !== undefined && costPrice >= 0) {
    const profit = price - costPrice;
    if (profit <= 0) return 0;
    const margin = profit / price;
    const group = findGroupForMargin(margin, groups);
    if (!group) return 0;
    return profit * group.profitShareRate;
  }

  // Fallback: dùng fallbackRate của nhóm đầu tiên (margin thấp nhất)
  const sorted = [...groups].sort((a, b) => a.order - b.order);
  const fallback = sorted[0]?.fallbackRate ?? 0;
  return price * fallback;
}
