import { apiClient } from '@/services/api/client';
import { Order, DeliveryType, OrderStatus } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';

/** Định dạng địa chỉ SPX: 'new' = 2 cấp (Tỉnh/Xã), 'old' = 3 cấp (Tỉnh/Quận/Xã). */
export type SpxAddressMode = 'new' | 'old';

/**
 * Địa chỉ đã giải sẵn cho 1 đơn (hệ CŨ, giải ở BE): `state` = Tỉnh ("TP. HỒ CHÍ MINH"),
 * `city` = Quận/Huyện, `ward` = Xã/Phường. Khi xuất vào sheet "địa chỉ mới" chỉ dùng state + ward.
 */
export interface ResolvedAddress {
  province?: string;
  state?: string;
  city?: string;
  ward: string;
}

/** Đơn cần tạo vận đơn SPX: CHỈ giao ship TỈNH, chưa có mã vận đơn, chưa huỷ/giao/hoàn. */
export const isSpxShippable = (o: Order): boolean => {
  const isShipProvince = o.deliveryType === DeliveryType.SHIP_PROVINCE;
  const done =
    o.status === OrderStatus.CANCELLED ||
    o.status === OrderStatus.DELIVERED ||
    o.status === OrderStatus.RETURNED;
  return isShipProvince && !done && !o.trackingNumber;
};

/** COD cần thu = còn lại = total − đã trả (đơn cọc trước + ship COD). */
export const codRemaining = (o: Order): number =>
  Math.max(0, getOrderTotal(o) - (Number(o.paidAmount) || 0));

/**
 * 1 dòng đơn theo đúng thứ tự cột sheet "Tạo đơn (địa chỉ mới)" (2 cột địa chỉ: Tỉnh + Xã).
 * Tỉnh dùng format CŨ ("TP. HỒ CHÍ MINH") theo yêu cầu SPX; bỏ cột Quận/Huyện (sheet mới không có).
 */
const buildRow = (
  o: Order,
  weightKg: number,
  resolved?: ResolvedAddress,
): (string | number)[] => {
  const cod = codRemaining(o);
  const productName = (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ');
  const detailAddress = [o.customer.address, o.customer.city].filter(Boolean).join(', ');

  // Sheet "địa chỉ mới": D = Tỉnh (TP. HỒ CHÍ MINH), E = Xã. Không có cột Quận/Huyện.
  const addressCols = [resolved?.state ?? '', resolved?.ward ?? ''];

  return [
    o.orderNumber || o.id,          // Mã đơn hàng
    o.customer.name || '',          // Tên người nhận
    String(o.customer.phone || ''), // Số điện thoại (giữ số 0 đầu)
    ...addressCols,                 // Tỉnh + Xã
    detailAddress,                  // Địa chỉ chi tiết
    '',                             // Lưu ý về địa chỉ
    '',                             // Mã bưu chính
    productName,                    // Tên sản phẩm
    '',                             // Số lượng
    '',                             // Giá tiền
    weightKg,                       // Tổng cân nặng (KG)
    '',                             // Chiều dài
    '',                             // Chiều rộng
    '',                             // Chiều cao
    '',                             // Mã khách hàng
    getOrderTotal(o),               // Giá trị đơn hàng
    'N',                            // Giao hàng một phần
    'N',                            // Cho phép thử hàng
    'Y',                            // Cho xem hàng, không cho thử
    'N',                            // Thu phí từ chối nhận hàng
    '',                             // Phí từ chối nhận hàng cần thu
    cod > 0 ? 'Y' : 'N',            // Thu COD
    cod > 0 ? cod : '',             // Số tiền COD (còn lại phải thu)
    'N',                            // bưu gửi giá trị cao
    'Người gửi trả',                // Hình thức thanh Toán
    o.note || '',                   // Lưu ý giao hàng
    '',                             // Nhắc nhở điền đúng số tiền COD
    '',                             // Đơn chỉ hoàn thành nếu "Đủ điều kiện"
  ];
};

const MAX_ROWS = 2000;

/**
 * Xuất đơn ra file tạo đơn hàng loạt SPX. FE dựng các DÒNG data (đã có Tỉnh/Xã giải sẵn từ
 * rule-based + AI) rồi gửi BE (`POST /orders/spx-file`) — BE mổ file nền đã upload-OK, nén
 * DEFLATE (<5MB) và trả file .xlsx. Trả về số đơn đã xuất.
 */
export const exportOrdersToSpx = async (
  orders: Order[],
  opts: { weightKg?: number; resolved?: ResolvedAddress[] } = {},
): Promise<number> => {
  const { weightKg = 1, resolved } = opts;
  const list = orders.slice(0, MAX_ROWS);
  const rows = list.map((o, i) => buildRow(o, weightKg, resolved?.[i]));

  // Điền vào sheet "Tạo đơn (địa chỉ mới)" (BE mode 'new' → sheet2).
  const res = await apiClient.post(
    '/orders/spx-file',
    { rows, addressMode: 'new' },
    { responseType: 'blob' },
  );

  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SPX_TaoDon_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return list.length;
};
