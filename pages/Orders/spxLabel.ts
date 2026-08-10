import { Order } from '@/types';

// Endpoint tải label của portal SPX. KHÔNG có API chính thức — dùng chính phiên đăng nhập
// seller trên trình duyệt: request top-level (thẻ <a>) tới URL này, cookie SPX tự gửi kèm →
// SPX trả file label để tải. (Chưa đăng nhập SPX sẽ báo "token not found".)
//
// ⚠️ SPX chỉ nhận TỪNG order_sn / request — KHÔNG nhét cả list vào order_sn_list.
const SPX_LABEL_ENDPOINT =
  'https://spx.vn/shipment/order/logistic/label/batch_get_shipping_label';

/** order_sn = mã VĐ SPX bỏ tiền tố "SPX" (SPXVN069008169588 → VN069008169588). */
export const toSpxOrderSn = (trackingNumber: string): string =>
  trackingNumber.trim().replace(/^SPX/i, '');

/** URL tải label 1 đơn (mỗi request đúng 1 order_sn). */
export const spxLabelUrl = (orderSn: string): string =>
  `${SPX_LABEL_ENDPOINT}?order_sn_list=${encodeURIComponent(orderSn)}`;

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
 * Tải label từng file: mỗi order_sn tạo 1 thẻ <a> top-level rồi click → cookie phiên SPX gửi
 * kèm, SPX trả file (attachment) → trình duyệt tải về. Fire ĐỒNG BỘ trong cùng user-gesture
 * (click nút) để trình duyệt không chặn nhiều lượt tải liên tiếp.
 */
export const downloadSpxLabels = (orderSns: string[]): void => {
  orderSns.forEach((sn) => {
    const a = document.createElement('a');
    a.href = spxLabelUrl(sn);
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
};
