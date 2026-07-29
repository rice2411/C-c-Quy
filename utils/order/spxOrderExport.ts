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
 * 1 dòng đơn theo đúng thứ tự cột template SPX. Số tiền (Giá tiền/Giá trị đơn/COD) đều = phần
 * THU HỘ còn lại (đã trừ cọc); đơn không COD dùng tổng. Cột A = số nhóm bưu gửi; Mã KH = mã đơn shop.
 * - mode 'new' (2 cấp): D=Tỉnh, E=Quận/Huyện — sheet "Tạo đơn (địa chỉ mới)" (29 cột).
 * - mode 'old' (3 cấp): D=Tỉnh, E=Quận/Huyện, F=Xã/Phường — sheet "Tạo đơn (địa chỉ cũ)" (30 cột).
 */
const buildRow = (
  o: Order,
  seq: number,
  weightKg: number,
  mode: SpxAddressMode,
  resolved?: ResolvedAddress,
): (string | number)[] => {
  const cod = codRemaining(o);
  const money = cod > 0 ? cod : getOrderTotal(o); // Giá tiền = Giá trị đơn = số thu hộ
  const codFlag = cod > 0 ? 'Y' : 'N';
  const codAmt: string | number = cod > 0 ? cod : '';
  const productName = (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ');
  const detailAddress = [o.customer.address, o.customer.city].filter(Boolean).join(', ');
  const name = o.customer.name || '';
  const phone = String(o.customer.phone || '');
  const custRef = o.orderNumber || o.id; // Mã khách hàng = tham chiếu shop
  const st = resolved?.state ?? '';
  const city = resolved?.city ?? '';
  const ward = resolved?.ward ?? '';

  if (mode === 'old') {
    // 3 cấp — khớp cột sheet "Tạo đơn (địa chỉ cũ)"/example (A..AD, 30 cột).
    return [
      seq,            // A Mã đơn (số nhóm bưu gửi)
      name,           // B Tên
      phone,          // C SĐT
      st,             // D Tỉnh
      city,           // E Quận/Huyện
      ward,           // F Xã/Phường
      detailAddress,  // G Địa chỉ chi tiết
      '',             // H Lưu ý địa chỉ
      '',             // I Mã bưu chính
      productName,    // J Tên sản phẩm
      1,              // K Số lượng
      money,          // L Giá tiền
      weightKg,       // M Tổng cân nặng
      '',             // N Chiều dài
      '',             // O Chiều cao
      '',             // P Chiều rộng
      custRef,        // Q Mã khách hàng
      money,          // R Giá trị đơn hàng
      'N',            // S Giao hàng một phần
      'N',            // T Cho phép thử
      'Y',            // U Cho xem, không thử
      'N',            // V Thu phí từ chối
      '',             // W Phí từ chối
      codFlag,        // X Thu COD
      codAmt,         // Y Số tiền COD
      'N',            // Z bưu gửi giá trị cao
      'Người gửi trả',// AA Hình thức thanh toán
      o.note || '',   // AB Lưu ý giao hàng
      '',             // AC Nhắc nhở COD (công thức)
      '',             // AD Đủ điều kiện (công thức)
    ];
  }

  // 2 cấp — khớp cột sheet "Tạo đơn (địa chỉ mới)" (A..AC, 29 cột), E = Quận/Huyện.
  return [
    seq,            // A Mã đơn (số nhóm bưu gửi)
    name,           // B Tên
    phone,          // C SĐT
    st,             // D Tỉnh
    city,           // E Quận/Huyện (ô địa chỉ 2 của sheet mới)
    detailAddress,  // F Địa chỉ chi tiết
    '',             // G Lưu ý địa chỉ
    '',             // H Mã bưu chính
    productName,    // I Tên sản phẩm
    1,              // J Số lượng
    money,          // K Giá tiền
    weightKg,       // L Tổng cân nặng
    '',             // M Chiều dài
    '',             // N Chiều rộng
    '',             // O Chiều cao
    custRef,        // P Mã khách hàng
    money,          // Q Giá trị đơn hàng
    'N',            // R Giao hàng một phần
    'N',            // S Cho phép thử
    'Y',            // T Cho xem, không thử
    'N',            // U Thu phí từ chối
    '',             // V Phí từ chối
    codFlag,        // W Thu COD
    codAmt,         // X Số tiền COD
    'N',            // Y bưu gửi giá trị cao
    'Người gửi trả',// Z Hình thức thanh toán
    o.note || '',   // AA Lưu ý giao hàng
    '',             // AB Nhắc nhở COD (công thức)
    '',             // AC Đủ điều kiện (công thức)
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
  opts: { weightKg?: number; addressMode?: SpxAddressMode; resolved?: ResolvedAddress[] } = {},
): Promise<number> => {
  const { weightKg = 1, addressMode = 'new', resolved } = opts;
  const list = orders.slice(0, MAX_ROWS);
  const rows = list.map((o, i) => buildRow(o, i + 1, weightKg, addressMode, resolved?.[i]));

  // 'old' → sheet "Tạo đơn (địa chỉ cũ)" (sheet1, 3 cấp); 'new' → "địa chỉ mới" (sheet2, 2 cấp).
  const res = await apiClient.post(
    '/orders/spx-file',
    { rows, addressMode },
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
