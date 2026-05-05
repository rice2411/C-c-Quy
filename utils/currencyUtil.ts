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