/**
 * Nhóm hoa hồng dựa trên biên lợi nhuận (margin), có bậc theo số lượng bán.
 *
 * - Nhóm được chọn theo margin của sản phẩm (minMargin..maxMargin).
 * - Mỗi nhóm có nhiều BẬC số lượng (tiers): bán càng nhiều (trong tháng, theo
 *   từng CTV, đếm riêng theo nhóm) thì % lợi nhuận càng cao.
 * - Áp rate "toàn bộ theo bậc đạt được": đạt mốc nào thì cả số lượng hưởng rate
 *   của mốc đó.
 *
 * Công thức cho 1 sản phẩm (1 đơn vị):
 *   Có costPrice : commission = (price - costPrice) × profitShareRate(bậc)
 *   Fallback     : commission = price × fallbackRate
 */

/** Một bậc số lượng trong nhóm */
export interface CommissionTier {
  /** Số lượng tối thiểu (tính theo tháng/CTV/nhóm) để đạt bậc này. Bậc đầu nên = 1 */
  minQty: number;
  /** Tỷ lệ chia sẻ lợi nhuận của bậc (0–1), VD 0.20 = 20% của (P-C) */
  profitShareRate: number;
}

export interface CommissionGroup {
  id: string;
  name: string;
  /** Margin tối thiểu (0–1), inclusive */
  minMargin: number;
  /** Margin tối đa (0–1), exclusive (trừ nhóm cuối cùng) */
  maxMargin: number;
  /** Bậc % lợi nhuận theo số lượng (sắp theo minQty tăng dần) */
  tiers: CommissionTier[];
  /** @deprecated Dữ liệu cũ — dùng tiers thay thế. Giữ để tương thích doc cũ. */
  profitShareRate?: number;
  /** Fallback khi không có costPrice: % trên giá bán (0–1) */
  fallbackRate: number;
  /** Thứ tự hiển thị / so sánh */
  order: number;
}

export const DEFAULT_COMMISSION_GROUPS: Omit<CommissionGroup, 'id'>[] = [
  {
    name: 'Cơ bản', minMargin: 0, maxMargin: 0.25, fallbackRate: 0.03, order: 1,
    tiers: [{ minQty: 1, profitShareRate: 0.15 }, { minQty: 30, profitShareRate: 0.18 }, { minQty: 60, profitShareRate: 0.22 }],
  },
  {
    name: 'Trung bình', minMargin: 0.25, maxMargin: 0.45, fallbackRate: 0.05, order: 2,
    tiers: [{ minQty: 1, profitShareRate: 0.20 }, { minQty: 30, profitShareRate: 0.24 }, { minQty: 60, profitShareRate: 0.28 }],
  },
  {
    name: 'Tốt', minMargin: 0.45, maxMargin: 0.65, fallbackRate: 0.08, order: 3,
    tiers: [{ minQty: 1, profitShareRate: 0.25 }, { minQty: 30, profitShareRate: 0.30 }, { minQty: 60, profitShareRate: 0.35 }],
  },
  {
    name: 'Cao cấp', minMargin: 0.65, maxMargin: 1, fallbackRate: 0.10, order: 4,
    tiers: [{ minQty: 1, profitShareRate: 0.30 }, { minQty: 30, profitShareRate: 0.35 }, { minQty: 60, profitShareRate: 0.40 }],
  },
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
 * Lấy danh sách bậc của nhóm (đã sắp theo minQty tăng dần).
 * Tương thích dữ liệu cũ: nếu chưa có tiers nhưng có profitShareRate → 1 bậc.
 */
export function getGroupTiers(group: CommissionGroup): CommissionTier[] {
  if (Array.isArray(group.tiers) && group.tiers.length > 0) {
    return [...group.tiers].sort((a, b) => a.minQty - b.minQty);
  }
  return [{ minQty: 1, profitShareRate: group.profitShareRate ?? 0 }];
}

/**
 * % lợi nhuận áp dụng theo số lượng bán (toàn bộ theo bậc đạt được):
 * chọn bậc cao nhất có minQty <= qty. Nếu qty dưới tất cả → dùng bậc đầu.
 */
export function rateForQuantity(group: CommissionGroup, qty: number): number {
  const tiers = getGroupTiers(group);
  if (tiers.length === 0) return 0;
  let rate = tiers[0].profitShareRate;
  for (const t of tiers) {
    if (qty >= t.minQty) rate = t.profitShareRate;
  }
  return rate;
}

/**
 * Hoa hồng cho 1 đơn vị sản phẩm khi đã biết rate (profitShareRate) cần áp.
 * Có costPrice → (price - cost) × rate; ngược lại → price × fallbackRate.
 */
export function itemCommissionAtRate(
  price: number,
  costPrice: number | undefined,
  fallbackRate: number,
  profitShareRate: number,
): number {
  if (!price || price <= 0) return 0;
  if (costPrice !== undefined && costPrice >= 0) {
    const profit = price - costPrice;
    if (profit <= 0) return 0;
    return profit * profitShareRate;
  }
  return price * fallbackRate;
}

/**
 * Ước tính hoa hồng / 1 đơn vị ở BẬC ĐẦU (số lượng thấp nhất).
 * Dùng cho các màn hình xem nhanh (preview) khi chưa biết số lượng tháng.
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
    const baseRate = getGroupTiers(group)[0]?.profitShareRate ?? 0;
    return profit * baseRate;
  }

  // Fallback: dùng fallbackRate của nhóm đầu tiên (margin thấp nhất)
  const sorted = [...groups].sort((a, b) => a.order - b.order);
  const fallback = sorted[0]?.fallbackRate ?? 0;
  return price * fallback;
}
