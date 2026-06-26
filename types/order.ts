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
 * Nhãn phụ thu cho đơn — nay là tag ĐỘNG quản lý trong Cài đặt đơn hàng.
 * Đơn chỉ lưu `key` (string). Định nghĩa + helper ở `@/types/surchargeTag`.
 * Re-export helper + fallback tĩnh để các consumer cũ import từ `@/types/order` vẫn chạy.
 */
export {
  surchargeTagLabel,
  DEFAULT_SURCHARGE_TAGS,
  type SurchargeTag as SurchargeTagDef,
} from './surchargeTag';

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

/** 1 dòng item được hoàn trong 1 lần hoàn tiền (khớp BE). */
export interface OrderRefundItem {
  productName: string;
  qtyRefunded: number;
  unitPrice: number; // VND
  amount: number; // VND = qtyRefunded × unitPrice (BE chuẩn KM/phụ thu)
}

/** 1 bản ghi hoàn tiền của đơn (khớp BE). Mảng refunds sắp mới→cũ. */
export interface OrderRefund {
  id: string;
  amount: number; // VND
  reason?: string;
  items: OrderRefundItem[];
  createdAt?: any;
  createdBy?: string;
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
  /** Nhãn phụ thu — `key` của tag động (vd 'decoration'). */
  surchargeTag?: string;
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
  /** Lịch sử hoàn tiền (mới→cũ) — mỗi lần giảm SL trên đơn PAID sinh 1 bản ghi. */
  refunds?: OrderRefund[];
}
