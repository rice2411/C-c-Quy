/**
 * Bảng màu dùng chung cho chart/legend/ranked-list thống kê.
 * Thay cho các mảng hex rải rác (CAT_COLORS, COST_COLORS...) ở từng page.
 */
export const CHART_COLORS = [
  '#8b5cf6', // tím
  '#0ea5e9', // xanh dương
  '#16a34a', // xanh lá
  '#d97706', // cam
  '#e11d48', // đỏ hồng
  '#4abab9', // teal (primary)
  '#64748b', // xám
  '#f59e0b', // vàng
] as const;

/** Lấy màu theo index (lặp vòng khi vượt số màu). */
export const colorAt = (i: number): string => CHART_COLORS[i % CHART_COLORS.length];
