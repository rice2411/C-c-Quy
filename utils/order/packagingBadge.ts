/**
 * Nhãn đóng gói (Hộp / Gói) → icon + màu badge RIÊNG để order list dễ phân biệt bằng mắt.
 * Khớp theo chữ trong label (không phân biệt hoa/thường, có dấu):
 *   - "hộp"  → 📦 vàng hổ phách
 *   - "gói"  → 🎀 xanh da trời
 *   - khác   → 📦 tím (màu primary mặc định)
 */
export interface PackagingBadgeStyle {
  icon: string;
  backgroundClassName: string;
  textClassName: string;
}

export const packagingBadgeStyle = (option?: string): PackagingBadgeStyle => {
  const s = (option || '').toLowerCase();
  if (s.includes('hộp')) {
    return {
      icon: '📦',
      backgroundClassName: 'bg-amber-100 dark:bg-amber-900/40',
      textClassName: 'text-amber-700 dark:text-amber-300',
    };
  }
  if (s.includes('gói')) {
    return {
      icon: '🎀',
      backgroundClassName: 'bg-sky-100 dark:bg-sky-900/40',
      textClassName: 'text-sky-700 dark:text-sky-300',
    };
  }
  return {
    icon: '📦',
    backgroundClassName: 'bg-primary-100 dark:bg-primary-900/40',
    textClassName: 'text-primary-700 dark:text-primary-300',
  };
};
