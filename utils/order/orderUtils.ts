

import { Order, OrderDecoration, OrderItem } from '@/types/order';
import { UserData, UserRole } from '@/types/user';
import { parseDateValue } from '../format/dateUtil';

/**
 * Chia phụ thu tổng đơn theo số lượng từng dòng SP — thuật toán PHẢI khớp BE.
 * Làm tròn tới đồng (Math.round), dồn phần dư vào SP CUỐI để tổng share = total.
 * Σqty === 0 → trả mảng rỗng (phụ thu vẫn ở cấp đơn, không chia được).
 *
 * @param total - Tổng phụ thu (VND)
 * @param items - Danh sách dòng có `quantity`
 * @returns Mảng tiền phụ thu cho từng dòng (cùng thứ tự, cùng độ dài items)
 */
export const allocateSurcharge = (
  total: number,
  items: { quantity: number }[],
): number[] => {
  const totalNum = Number(total) || 0;
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  if (totalQty <= 0 || totalNum <= 0) return items.map(() => 0);

  const shares: number[] = [];
  let running = 0;
  for (let i = 0; i < items.length - 1; i++) {
    const share = Math.round((totalNum * Number(items[i].quantity || 0)) / totalQty);
    shares.push(share);
    running += share;
  }
  // SP cuối gánh phần dư để tổng khớp đúng total
  shares.push(totalNum - running);
  return shares;
};

/**
 * Tính tổng giá trị đơn hàng từ items và shipping cost
 * @param items - Danh sách items trong đơn hàng
 * @param shippingCost - Chi phí vận chuyển
 * @param decorations - Trang trí cũ (đơn cũ, backward compat)
 * @param surchargeAmount - Phụ thu tổng đơn (mô hình mới) — cộng vào subtotal trước giảm
 * @returns Tổng giá trị đơn hàng
 */
export const calculateOrderTotal = (
  items: OrderItem[],
  shippingCost: number = 0,
  decorations: OrderDecoration[] = [],
  surchargeAmount: number = 0,
): number => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const decorationsTotal = decorations.reduce((sum, d) => sum + (Number(d.price) * Number(d.quantity)), 0);
  return subtotal + Number(shippingCost) + decorationsTotal + Number(surchargeAmount || 0);
};

/**
 * Lấy tổng giá trị đơn hàng (ưu tiên dùng order.total, nếu không có thì tính lại)
 * @param order - Đơn hàng
 * @returns Tổng giá trị đơn hàng
 */
export const getOrderTotal = (order: Order): number => {
  if (order.total && order.total > 0) {
    return Number(order.total);
  }
  const gross = calculateOrderTotal(
    order.items || [],
    order.shippingCost || 0,
    order.decorations || [],
    order.surchargeAmount || 0,
  );
  // Thiếu order.total → tự tính net = gộp − GIẢM GIÁ KM − GIẢM GIÁ TAY, tránh thổi phồng doanh thu.
  return Math.max(
    0,
    gross - Number(order.discountAmount || 0) - Number(order.manualDiscountAmount || 0),
  );
};

/** Thông tin cọc để hiển thị (list + card chia sẻ + chi tiết). */
export interface DepositDisplay {
  show: boolean;
  deposit: number;   // cọc thoả thuận
  paid: number;      // đã nhận
  remaining: number; // còn lại
  statusLabel: string;
}

export const getDepositInfo = (order: Order, total: number): DepositDisplay => {
  const deposit = Number(order.depositAmount) || 0;
  const paid = Number(order.paidAmount) || 0;
  const show = deposit > 0 || (paid > 0 && paid < total);
  const statusLabel =
    total > 0 && paid >= total ? 'Đã thanh toán đủ'
    : paid > 0 ? 'Đã cọc'
    : 'Chưa cọc';
  return { show, deposit, paid, remaining: Math.max(0, total - paid), statusLabel };
};

/**
 * Mốc thời gian "doanh thu" của 1 đơn — dùng cho mọi tính toán revenue/period
 * trên Dashboard (Today / Chart / Goal / TopProducts / TopCustomers).
 *
 * Ưu tiên `deliveryDate` (ngày bán/giao thực tế) → phản ánh đúng output của
 * bakery (sản xuất + giao trong ngày). Fallback `createdAt` cho đơn walk-in
 * không có deliveryDate.
 */
export const getOrderRevenueDate = (order: any): Date | null => {
  const delivery = parseDateValue(order?.deliveryDate);
  if (delivery) return delivery;
  const created = order?.createdAt?.toDate
    ? order.createdAt.toDate()
    : order?.createdAt
      ? new Date(order.createdAt)
      : null;
  return created instanceof Date && !isNaN(created.getTime()) ? created : null;
};

/** Admin / Super Admin: sửa mọi đơn. CTV (COLABORATOR): chỉ đơn do chính UID đó tạo (`createdByUid`). */
export function userCanEditOrder(
  user: UserData | null | undefined,
  order: Order | null | undefined,
): boolean {
  if (!user || !order) return false;
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.COLABORATOR) {
    if (!order.createdByUid) return false;
    return order.createdByUid === user.uid;
  }
  return false;
}

/**
 * Tạo URL ảnh QR code thanh toán (SePay VietQR).
 * Config (số TK / mã bank / template) = TK ACTIVE, bơm vào từ usePaymentAccounts() (React)
 * hoặc fetchPaymentAccounts() → find(isActive) (non-React) — KHÔNG hardcode.
 * Nội dung CK = mã đơn đứng một mình (vd "ORD-000415"); nếu là CỌC thì thêm prefix "C"
 * (vd "CORD-000415"). Bỏ prefix "SEVQR" cũ — BE vẫn trích ORD<digits> nên match như thường.
 * @param orderNumber - Mã đơn (vd "ORD-2026-001")
 * @param total - Tổng tiền (VND)
 * @param config - Cấu hình thanh toán (bankCode/accountNumber/qrTemplate)
 * @param isDeposit - true → nội dung CK có prefix "C" (giao dịch cọc)
 * @returns URL ảnh QR, hoặc '' nếu thiếu số TK / mã bank (fallback an toàn, không tạo URL vỡ)
 */
export const generateQRCodeImage = (
  orderNumber: string,
  total: number,
  config: { bankCode: string; accountNumber: string; qrTemplate?: string },
  isDeposit = false,
): string => {
  const acc = (config?.accountNumber ?? '').trim();
  const bank = (config?.bankCode ?? '').trim();
  if (!acc || !bank) return '';
  const template = (config?.qrTemplate ?? 'compact').trim() || 'compact';
  const des = `${isDeposit ? 'C' : ''}${orderNumber}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(acc)}&bank=${encodeURIComponent(bank)}&amount=${Math.round(total)}&des=${encodeURIComponent(des)}&template=${encodeURIComponent(template)}`;
  return qrUrl;
};


/**
 * Tạo URL ảnh sản phẩm dựa trên loại sản phẩm
 */
export const getProductImage = (type: string): string => {
  const t = (type || '').toLowerCase();
  if (t.includes('family') || t.includes('gia đình')) return 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=200';
  if (t.includes('friend') || t.includes('tình bạn')) return 'https://images.unsplash.com/photo-1621236378699-8597f840b45a?auto=format&fit=crop&q=80&w=200';
  if (t.includes('set') || t.includes('quà') || t.includes('gif')) return 'https://images.unsplash.com/photo-1549488352-22668e9e6c1c?auto=format&fit=crop&q=80&w=200';
  if (t.includes('cookie') || t.includes('bánh')) return 'https://images.unsplash.com/photo-1499636138143-bd649025ebeb?auto=format&fit=crop&q=80&w=200';
  if (t.includes('cake') || t.includes('kem')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200';
  return `https://placehold.co/200x200?text=${encodeURIComponent(type || 'Product')}`;
};



export interface ExportColumn {
  id: string;
  label: string;
  field: (order: Order) => any;
}
