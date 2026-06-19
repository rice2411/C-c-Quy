/**
 * Chuyển về dạng tiền tệ Việt Nam
 * @param amount - Tiền dạng số
 * @returns Tiền dạng chuỗi
 */
export const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/** Số tiền VND; null/NaN → dấu gạch (dùng bảng bill, thống kê). */
export function formatVNDOrDash(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return formatVND(n);
}

/**
 * VND rút gọn cho chỗ hẹp (vd Dashboard "Hôm nay"): 520.000 → "520k",
 * 2.092.000 → "2,1tr", 1.2 tỷ → "1,2 tỷ". Nên kèm title = formatVND() để xem đủ.
 */
export function formatVNDCompact(amount: number): string {
  if (amount == null || Number.isNaN(amount)) return '0đ';
  const abs = Math.abs(amount);
  const fmt = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  if (abs >= 1_000_000_000) return `${fmt(amount / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${fmt(amount / 1_000_000)}tr`;
  if (abs >= 1_000) return `${fmt(amount / 1_000)}k`;
  return `${amount.toLocaleString('vi-VN')}đ`;
}