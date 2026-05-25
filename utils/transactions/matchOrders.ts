import { Order } from '@/types/order';
import { Transaction } from '@/types/transaction';
import { PaymentMethod, PaymentStatus } from '@/types/enums';

export interface OrderSuggestion {
  order: Order;
  /** Số phút kể từ khi tạo đơn đến khi giao dịch xảy ra */
  minutesAfterOrder: number;
  /** Điểm khớp: càng cao càng tốt */
  score: number;
}

/** Chuyển Firestore Timestamp hoặc ISO string thành Date */
const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Firestore Timestamp có .toDate()
  if (typeof val === 'object' && typeof val.toDate === 'function') return val.toDate();
  // ISO string hoặc timestamp number
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Tìm các đơn hàng có thể khớp với giao dịch không hợp lệ (không có mã đơn).
 * Tiêu chí:
 *  1. `order.total === tr.transferAmount` — số tiền khớp chính xác
 *  2. `tr.transactionDate >= order.createdAt` — giao dịch xảy ra SAU khi tạo đơn
 *  3. Ưu tiên đơn chưa thanh toán (paymentStatus !== PAID)
 *  4. Ưu tiên đơn gần nhất về thời gian (khoảng cách nhỏ nhất)
 */
export const getOrderSuggestions = (
  transaction: Transaction,
  orders: Order[],
  maxResults = 5,
): OrderSuggestion[] => {
  const txDate = toDate(transaction.transactionDate);
  if (!txDate) return [];

  const suggestions: OrderSuggestion[] = [];

  for (const order of orders) {
    // Chỉ xét đơn chuyển khoản
    if (order.paymentMethod !== PaymentMethod.BANKING) continue;

    // Kiểm tra số tiền khớp
    if (order.total !== transaction.transferAmount) continue;

    // Kiểm tra thời gian: giao dịch phải xảy ra SAU hoặc đúng lúc tạo đơn
    const orderDate = toDate(order.createdAt ?? order.orderDate ?? order.date);
    if (!orderDate) continue;
    if (txDate < orderDate) continue;

    const minutesAfterOrder = Math.round((txDate.getTime() - orderDate.getTime()) / 60000);

    // Tính điểm: đơn chưa thanh toán được ưu tiên, gần thời gian được ưu tiên
    const unpaidBonus = order.paymentStatus !== PaymentStatus.PAID ? 1000 : 0;
    const noSepayBonus = !order.sepayId ? 500 : 0;
    // Trừ điểm theo số phút (tối đa 10080 phút = 7 ngày; quá 7 ngày bỏ)
    if (minutesAfterOrder > 10080) continue;
    const timeScore = Math.max(0, 10080 - minutesAfterOrder);

    suggestions.push({
      order,
      minutesAfterOrder,
      score: unpaidBonus + noSepayBonus + timeScore,
    });
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

/** Format khoảng cách thời gian thân thiện */
export const formatTimeDiff = (minutes: number): string => {
  if (minutes < 1) return 'Ngay lập tức';
  if (minutes < 60) return `${minutes} phút sau`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ sau`;
  const days = Math.round(hours / 24);
  return `${days} ngày sau`;
};
