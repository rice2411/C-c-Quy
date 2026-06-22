import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryType } from './enums';
import { Customer } from './customer';
import { AppliedPromotion, GiftItem } from './promotion';

export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  /** HH của cả dòng (qty × đơn giá HH), tính lúc hiển thị — KHÔNG lưu Firestore */
  commissionAmount?: number;
  /** Tên nhóm hoa hồng sản phẩm rơi vào (tính lúc hiển thị) */
  commissionGroupName?: string;
  /** Tổng SL của nhóm đó trong tháng (quyết định bậc) */
  commissionGroupQty?: number;
  /** % lợi nhuận (rate) đã áp theo bậc */
  commissionRate?: number;
}

export interface OrderDecoration {
  materialId: string;
  name: string;
  quantity: number;
  price: number; // đơn giá VND (có thể đã sửa tay)
}

/**
 * Nhãn phụ thu cho đơn (mô hình mới — thay "Trang trí thêm" cũ).
 * Phụ thu là 1 tổng tiền cấp đơn + 1 nhãn, tự chia theo số lượng SP.
 */
export type SurchargeTag = 'decoration' | 'theme' | 'accessory';

/**
 * Danh sách nhãn phụ thu cho dropdown + chip preset.
 * `preset` = mức gợi ý (VND) khi bấm chip — PHẢI khớp BE.
 */
export const SURCHARGE_TAGS: { value: SurchargeTag; label: string; preset: number }[] = [
  { value: 'decoration', label: 'Trang trí', preset: 1000 },
  { value: 'theme', label: 'Theme', preset: 0 },
  { value: 'accessory', label: 'Phụ kiện', preset: 0 },
];

/** Helper lookup nhãn phụ thu. */
export const surchargeTagLabel = (tag: SurchargeTag | undefined): string =>
  SURCHARGE_TAGS.find((s) => s.value === tag)?.label ?? 'Phụ thu';

export interface OrderFieldChange {
  field: string;
  label?: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export interface OrderHistoryEntry {
  at: any;
  by?: string;
  byUid?: string;
  changes: OrderFieldChange[];
}

export interface Order {
  id: string;
  orderNumber?: string;
  sepayId?: number;
  customer: Customer;
  items: OrderItem[];
  /** Vật phẩm trang trí thêm (chọn từ materials) — cộng vào total. Đơn cũ (backward compat). */
  decorations?: OrderDecoration[];
  /** Tổng phụ thu cả đơn (VND) — mô hình mới, tự chia theo SL sản phẩm. Cộng vào subtotal TRƯỚC giảm. */
  surchargeAmount?: number;
  /** Nhãn phụ thu (decoration/theme/accessory). */
  surchargeTag?: SurchargeTag;
  /** Tổng tiền hàng TRƯỚC giảm (items + decorations + surchargeAmount). */
  subtotal?: number;
  /** Tổng tiền đã giảm bởi khuyến mãi. */
  discountAmount?: number;
  /** Các khuyến mãi đã áp vào đơn. */
  appliedPromotions?: AppliedPromotion[];
  /** Quà tặng (Mua X tặng Y) — giá 0. */
  giftItems?: GiftItem[];
  /** = subtotal + shippingCost − discountAmount. */
  total: number;
  shippingCost?: number;
  /** Cache shipping info từ AddressMapInput — tránh fetch SerpApi khi edit */
  shipInfo?: {
    distanceKm?: number;
    distanceDisplay?: string;
    destLat?: number;
    destLng?: number;
    pickedAddress?: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryType?: DeliveryType;
  date: string;
  orderDate?: any;
  deliveryDate?: string;
  deliveryTime?: string;
  trackingNumber?: string;
  note?: string;
  createdByUid?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: any;
  updatedAt?: any;
  history?: OrderHistoryEntry[];
  isTest?: boolean;
  commissionAmount?: number;
  commissionStatus?: 'pending' | 'paid';
  commissionPaidAt?: string;
  badgeIds?: string[];
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  refundedAt?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundedBy?: string;
}
