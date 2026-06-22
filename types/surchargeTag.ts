/**
 * Tag phụ thu (mô hình động — quản lý trong Cài đặt đơn hàng, thay hardcode cũ).
 *
 * Khớp BE `GET/PUT /surcharge-tags` (SurchargeTag[] camelCase).
 * Xoá ưu tiên `active = false` (đơn cũ vẫn giữ nhãn theo `key`).
 */

export interface SurchargeTag {
  /** Mã ổn định, lưu vào đơn (vd 'decoration'). KHÔNG đổi sau khi tạo. */
  key: string;
  /** Nhãn hiển thị (data người dùng — không qua i18n). */
  label: string;
  /** Mức gợi ý (VND) khi bấm chip / chọn nhãn. */
  preset: number; // VND
  /** Bật/tắt: chỉ tag active mới hiện trong OrderForm. */
  active: boolean;
  /** Thứ tự hiển thị (tăng dần). */
  sortOrder: number;
}

/**
 * 3 seed mặc định — DÙNG LÀM FALLBACK TĨNH cho chỗ KHÔNG có list động
 * (vd util ngoài React như zaloUtil). PHẢI khớp seed BE.
 */
export const DEFAULT_SURCHARGE_TAGS: SurchargeTag[] = [
  { key: 'decoration', label: 'Trang trí', preset: 1000, active: true, sortOrder: 0 },
  { key: 'theme', label: 'Theme', preset: 0, active: true, sortOrder: 1 },
  { key: 'accessory', label: 'Phụ kiện', preset: 0, active: true, sortOrder: 2 },
];

/** Map fallback tĩnh key → label cho 3 seed (dùng khi không có list). */
const STATIC_LABEL_BY_KEY: Record<string, string> = DEFAULT_SURCHARGE_TAGS.reduce(
  (acc, t) => {
    acc[t.key] = t.label;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Lookup nhãn phụ thu.
 * - Ưu tiên list động truyền vào (data thật từ query).
 * - Fallback map tĩnh 3 seed (chỗ không có list).
 * - Cuối cùng fallback 'Phụ thu'.
 */
export const surchargeTagLabel = (
  tag: string | undefined,
  tags?: SurchargeTag[],
): string => {
  if (!tag) return 'Phụ thu';
  const fromList = tags?.find((t) => t.key === tag)?.label;
  if (fromList) return fromList;
  return STATIC_LABEL_BY_KEY[tag] ?? 'Phụ thu';
};
