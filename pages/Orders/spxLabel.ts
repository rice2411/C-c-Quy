import { Order } from '@/types';

// Endpoint in label hàng loạt của portal SPX. KHÔNG có API chính thức — dùng chính phiên
// đăng nhập seller trên trình duyệt: mở tab mới tới URL này, cookie SPX tự gửi kèm → SPX
// trả trang/PDF label để in. (Nếu chưa đăng nhập SPX sẽ báo lỗi "token not found".)
const SPX_LABEL_ENDPOINT =
  'https://spx.vn/shipment/order/logistic/label/batch_get_shipping_label';

/**
 * Chuyển mã vận đơn SPX (vd `SPXVN069008169588`) → `order_sn` mà endpoint in label nhận.
 * Theo phát hiện trên portal SPX: bỏ tiền tố `SPX`, giữ phần còn lại (`VN069008169588`).
 * ⚠️ Nếu SPX yêu cầu dạng khác (mã đầy đủ / chỉ phần số) → sửa DUY NHẤT hàm này.
 */
export const toSpxOrderSn = (trackingNumber: string): string =>
  trackingNumber.trim().replace(/^SPX/i, '');

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
 * Dựng URL mở tab in label hàng loạt cho các đơn SPX đang lọc.
 * Trả `null` nếu không có đơn SPX nào (caller báo toast).
 */
export const buildSpxLabelUrl = (orders: Order[]): string | null => {
  const tns = spxTrackingNumbers(orders);
  if (tns.length === 0) return null;
  // order_sn là chuỗi alphanumeric → encode từng phần rồi nối bằng dấu phẩy thô (SPX cần).
  const list = tns.map((tn) => encodeURIComponent(toSpxOrderSn(tn))).join(',');
  return `${SPX_LABEL_ENDPOINT}?order_sn_list=${list}`;
};
