/**
 * Tỉ lệ (0..1) → chuỗi phần trăm. Mặc định 1 chữ số thập phân.
 * VD: formatPercent(0.123) → "12.3%"; formatPercent(0.5, 0) → "50%".
 */
export const formatPercent = (ratio: number, digits = 1): string => {
  if (!Number.isFinite(ratio)) return '0%';
  return `${(ratio * 100).toFixed(digits)}%`;
};

/** phần / tổng → % nguyên (an toàn khi tổng = 0). VD: percentOf(3, 12) → 25. */
export const percentOf = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;
