import { Order } from '@/types';

// Endpoint in label hàng loạt của portal SPX. KHÔNG có API chính thức — dùng chính phiên
// đăng nhập seller trên trình duyệt: mở tab mới tới URL này, cookie SPX tự gửi kèm → SPX
// trả trang/PDF label để in. (Chưa đăng nhập SPX sẽ báo "token not found".)
//
// ⚠️ order_sn KHÔNG phải mã vận đơn (SPXVN...). Portal in theo `order_id` của SPX → phải
// map từng mã VĐ → order_id qua BE (get_order_info) TRƯỚC rồi mới ghép vào order_sn_list.
const SPX_LABEL_ENDPOINT =
  'https://spx.vn/shipment/order/logistic/label/batch_get_shipping_label';

/** Lọc mã vận đơn SPX (không trùng) từ tập đơn đang hiển thị theo filter. */
export const spxTrackingNumbers = (orders: Order[]): string[] =>
  Array.from(
    new Set(
      orders
        .map((o) => (o.trackingNumber || '').trim())
        .filter((tn) => /^SPXVN/i.test(tn)),
    ),
  );

/**
 * Dựng URL in label hàng loạt từ danh sách order_sn (đã map từ mã VĐ ở BE).
 * Trả `null` nếu rỗng.
 */
export const buildSpxLabelUrl = (orderSns: string[]): string | null => {
  const sns = orderSns.map((s) => s.trim()).filter(Boolean);
  if (sns.length === 0) return null;
  // order_sn alphanumeric → encode từng phần rồi nối bằng dấu phẩy thô (SPX cần).
  const list = sns.map((s) => encodeURIComponent(s)).join(',');
  return `${SPX_LABEL_ENDPOINT}?order_sn_list=${list}`;
};
