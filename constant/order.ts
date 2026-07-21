import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/index';


/**
 * Mau sac cua status
 */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.PROCESSING]: "bg-blue-100 text-blue-800",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-800",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800",
  [OrderStatus.RETURNED]: "bg-primary-100 text-primary-800",
};

/**
 * Mau sac cua phuong thuc thanh toan
 */
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANKING]: "bg-blue-100 text-blue-800",
  [PaymentMethod.CASH]: "bg-slate-100 text-slate-700",
};

/**
 * Mau sac cua trang thai thanh toan
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: "bg-emerald-100 text-emerald-800",
  [PaymentStatus.UNPAID]: "bg-red-200 text-red-700",
  [PaymentStatus.DEPOSITED]: "bg-amber-100 text-amber-800",
  [PaymentStatus.REFUNDED]: "bg-purple-100 text-purple-800",
};
