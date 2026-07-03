/** Khuyến mãi — đồng bộ shape với BE (backend/modules/promotions). */

export type ApplyMode = 'CODE' | 'AUTO';
export type DiscountType = 'PERCENT' | 'FIXED' | 'FREE_SHIP' | 'BUY_X_GET_Y';
export type PromotionScope = 'ALL' | 'PRODUCTS' | 'CATEGORIES';
export type PromotionStatus = 'active' | 'inactive';

export interface Promotion {
  id: string;
  name: string;
  applyMode: ApplyMode;
  code?: string | null;
  discountType: DiscountType;
  discountValue?: number;
  maxDiscount?: number | null;
  // Mua N tặng M theo nhóm: món rẻ nhất trong nhóm thành 0đ
  groupCategoryId?: string | null; // TÊN danh mục gom nhóm (ưu tiên)
  groupBadgeId?: string | null; // (legacy) badge gom nhóm — fallback
  buyQuantity?: number;
  getQuantity?: number;
  // legacy (không dùng)
  buyProductIds?: string[];
  getProductId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  minOrderValue?: number;
  scope: PromotionScope;
  productIds?: string[];
  categoryIds?: string[];
  maxUses?: number | null;
  usedCount: number;
  status: PromotionStatus;
  priority?: number;
  /** Lịch sử các đợt chạy đã đóng (mở lại → cất đợt hiện tại vào đây). */
  runs?: PromotionRun[];
  /** Số lần chạy = runs.length + 1 (đợt đang chạy) — BE tính. */
  runCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/** 1 đợt chạy đã đóng của khuyến mãi. */
export interface PromotionRun {
  startAt?: string | null; // ISO
  endAt?: string | null; // ISO
  usedCount: number; // lượt dùng trong đợt
  closedAt?: string | null; // ISO — thời điểm đóng đợt
}

/** Khuyến mãi đã áp vào đơn (lưu trong Order). */
export interface AppliedPromotion {
  promotionId: string;
  code?: string | null;
  name: string;
  type: DiscountType;
  amount: number;
}

/** Quà tặng (Mua X tặng Y) — giá 0. */
export interface GiftItem {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  price: 0;
}

/** Kết quả tính giảm giá từ BE (/promotions/preview). */
export interface ComputeResult {
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  appliedPromotions: AppliedPromotion[];
  giftItems: GiftItem[];
  errors: string[];
}

export const APPLY_MODES: { value: ApplyMode; label: string }[] = [
  { value: 'AUTO', label: 'Tự áp dụng (chiến dịch)' },
  { value: 'CODE', label: 'Nhập mã' },
];

export const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: 'PERCENT', label: 'Giảm theo %' },
  { value: 'FIXED', label: 'Giảm số tiền cố định' },
  { value: 'FREE_SHIP', label: 'Miễn phí ship' },
  { value: 'BUY_X_GET_Y', label: 'Mua X tặng Y' },
];

export const PROMOTION_SCOPES: { value: PromotionScope; label: string }[] = [
  { value: 'ALL', label: 'Toàn đơn' },
  { value: 'PRODUCTS', label: 'Sản phẩm cụ thể' },
  { value: 'CATEGORIES', label: 'Danh mục cụ thể' },
];

export const discountTypeLabel = (t: DiscountType | string): string =>
  DISCOUNT_TYPES.find((x) => x.value === t)?.label ?? String(t);

export const promotionStatusLabel = (s: PromotionStatus | string): string =>
  s === 'active' ? 'Đang chạy' : 'Tắt';
