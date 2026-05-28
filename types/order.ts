import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryType } from './enums';
import { Customer } from './customer';

export interface OrderItem {
  id: string;
  /** Product ID gốc (để tham chiếu sang collection products) */
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

/** Mot thay doi cua 1 field cu the trong 1 lan edit */
export interface OrderFieldChange {
  field: string;
  label?: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

/** 1 lan chinh sua don = 1 entry trong history array */
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
  history?: OrderHistoryEntry[];
  isTest?: boolean;
  commissionAmount?: number;
  commissionStatus?: 'pending' | 'paid';
  commissionPaidAt?: string;
  /** Badge IDs gán cho đơn (custom tags từ Settings → Badges) */
  badgeIds?: string[];
  // ===== Cancel / Refund =====
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  refundedAt?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundedBy?: string;
}
