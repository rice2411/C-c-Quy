import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryType } from './enums';
import { Customer } from './customer';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

/** Mot thay doi cua 1 field cu the trong 1 lan edit */
export interface OrderFieldChange {
  field: string;
  /** Label hien thi (vd: "Trang thai", "Tong tien") */
  label?: string;
  /** Gia tri cu — da stringify de de render */
  oldValue: string | number | null;
  /** Gia tri moi — da stringify */
  newValue: string | number | null;
}

/** 1 lan chinh sua don = 1 entry trong history array */
export interface OrderHistoryEntry {
  /** ISO string hoac Firestore Timestamp */
  at: any;
  /** Ten hien thi nguoi chinh */
  by?: string;
  /** UID cua nguoi chinh */
  byUid?: string;
  /** Danh sach cac field da doi */
  changes: OrderFieldChange[];
}

export interface Order {
  id: string;
  orderNumber?: string; // New human-readable ID (ORD-XXXXXX)
  sepayId?: number; // Transaction ID from SePay
  customer: Customer;
  items: OrderItem[];
  total: number;
  shippingCost?: number;
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
  /** Lich su cac lan chinh sua don (moi nhat o cuoi array) */
  history?: OrderHistoryEntry[];
  /** Don tao de test tinh nang — Zalo message se prepend banner ĐƠN HÀNG TEST */
  isTest?: boolean;
  /** Tổng hoa hồng snapshot tại thời điểm tạo đơn (chỉ áp dụng khi CTV tạo) */
  commissionAmount?: number;
  /** Trạng thái hoa hồng: pending = chưa trả, paid = đã trả */
  commissionStatus?: 'pending' | 'paid';
  /** Thời điểm đánh dấu đã trả hoa hồng */
  commissionPaidAt?: string;

  /** Badge IDs gán cho đơn (custom tags từ Settings → Badges) */
  badgeIds?: string[];

  // ===== Cancel / Refund =====
  /** Lý do huỷ đơn — chỉ có khi status = CANCELLED */
  cancelReason?: string;
  /** Thời điểm huỷ đơn (ISO) */
  cancelledAt?: string;
  /** Người huỷ đơn (display name) */
  cancelledBy?: string;
  /** Thời điểm hoàn tiền (ISO) — paymentStatus = REFUNDED */
  refundedAt?: string;
  /** Số tiền đã hoàn lại cho khách */
  refundedAmount?: number;
  /** Lý do hoàn tiền */
  refundReason?: string;
  /** Người thao tác hoàn tiền */
  refundedBy?: string;
}
