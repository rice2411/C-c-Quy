/**
 * Vị (flavor) — danh sách phẳng quản lý tập trung, có màu.
 * Dùng cho sản phẩm (khai báo vị) và đơn hàng (chọn vị khi bán).
 */
export interface ProductFlavor {
  id: string;
  name: string;
  /** Hex color cho chip hiển thị */
  color?: string;
  /** Vị trí sort (số nhỏ hiện trước) */
  sortOrder?: number;
}

/** Preset màu gợi ý khi tạo vị mới. */
export const DEFAULT_FLAVOR_COLORS = [
  '#ea580c', '#f59e0b', '#eab308', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#d946ef', '#ec4899', '#f43f5e',
];

/** Màu fallback khi vị không khớp danh sách quản lý. */
export const FLAVOR_FALLBACK_COLOR = '#64748b';

/** Tra màu của 1 vị theo tên (không phân biệt hoa thường) từ danh sách quản lý. */
export const flavorColor = (name: string, flavors: ProductFlavor[]): string => {
  const f = flavors.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return f?.color || FLAVOR_FALLBACK_COLOR;
};
