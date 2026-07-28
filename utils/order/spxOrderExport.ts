import * as XLSX from 'xlsx-js-style';
import { Order, DeliveryType, OrderStatus } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { matchAddress } from '@/utils/order/spxAddressMatch';

/** Định dạng địa chỉ SPX: 'new' = 2 cấp (Tỉnh/Xã, sau sáp nhập 2025), 'old' = 3 cấp (Tỉnh/Quận/Xã). */
export type SpxAddressMode = 'new' | 'old';

/** Tỉnh/Xã đã giải sẵn cho 1 đơn (rule-based hoặc AI). */
export interface ResolvedAddress {
  province: string;
  ward: string;
}

// Header đúng thứ tự + văn bản template SPX. Chỉ khác nhau ở cột Quận/Huyện (chỉ có ở 'old').
const H_COMMON_TAIL = [
  'Lưu ý về địa chỉ',
  'Mã bưu chính',
  '*Tên sản phẩm',
  'Số lượng (Thông tin bắt buộc khi chọn Giao hàng một phần & Thu COD)',
  'Giá tiền (Thông tin bắt buộc khi chọn Giao hàng một phần & Thu COD)',
  '*Tổng cân nặng bưu gửi (KG)',
  'Chiều dài (CM)',
  'Chiều rộng (CM)',
  'Chiều cao (CM)',
  'Mã khách hàng',
  '*Giá trị đơn hàng',
  '*Giao hàng một phần (Y/N)',
  '*Cho phép thử hàng (Y/N)',
  '*Cho xem hàng, không cho thử (Y/N)',
  'Thu phí từ chối nhận hàng (Y/N)',
  'Phí từ chối nhận hàng cần thu',
  '*Thu COD (Y/N)',
  'Số tiền COD',
  'bưu gửi giá trị cao (Y/N)',
  '*Hình thức thanh Toán',
  'Lưu ý giao hàng',
  'Nhắc nhở điền đúng số tiền COD',
  'Đơn chỉ hoàn thành nếu ở dưới hiện "Đủ điều kiện"',
];
const SPX_HEADER: Record<SpxAddressMode, string[]> = {
  new: ['*Mã đơn hàng', '*Tên người nhận', '*Số điện thoại', '*Tỉnh/Thành Phố', '*Xã/Phường', '*Địa chỉ chi tiết', ...H_COMMON_TAIL],
  old: ['*Mã đơn hàng', '*Tên người nhận', '*Số điện thoại', '*Tỉnh/Thành Phố', '*Quận/Huyện', '*Xã/Phường', '*Địa chỉ chi tiết', ...H_COMMON_TAIL],
};
const SHEET_NAME: Record<SpxAddressMode, string> = {
  new: 'Tạo đơn (địa chỉ mới)',
  old: 'Tạo đơn (địa chỉ cũ)',
};

/** Đơn cần tạo vận đơn SPX: giao ship, chưa có mã vận đơn, chưa huỷ/giao/hoàn. */
export const isSpxShippable = (o: Order): boolean => {
  const isShip = o.deliveryType === DeliveryType.SHIP || o.deliveryType === DeliveryType.SHIP_PROVINCE;
  const done =
    o.status === OrderStatus.CANCELLED ||
    o.status === OrderStatus.DELIVERED ||
    o.status === OrderStatus.RETURNED;
  return isShip && !done && !o.trackingNumber;
};

/** COD cần thu = còn lại = total − đã trả (đơn cọc trước + ship COD). */
export const codRemaining = (o: Order): number =>
  Math.max(0, getOrderTotal(o) - (Number(o.paidAmount) || 0));

/** 1 dòng đơn theo đúng thứ tự cột template SPX (khác nhau ở cột Quận/Huyện giữa 2 chế độ). */
const buildRow = (
  o: Order,
  weightKg: number,
  mode: SpxAddressMode,
  resolved?: ResolvedAddress,
): (string | number)[] => {
  const cod = codRemaining(o);
  const productName = (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ');
  const detailAddress = [o.customer.address, o.customer.city].filter(Boolean).join(', ');

  // Tỉnh/Xã: dùng kết quả đã giải sẵn (rule-based + AI) nếu có, không thì tự khớp rule-based.
  // 'new' = Tỉnh + Xã; 'old' = Tỉnh + Quận (để trống) + Xã.
  const { province, ward } = resolved ?? matchAddress(detailAddress);
  const addressCols = mode === 'old' ? [province, '', ward] : [province, ward];

  return [
    o.orderNumber || o.id,          // Mã đơn hàng
    o.customer.name || '',          // Tên người nhận
    String(o.customer.phone || ''), // Số điện thoại (giữ số 0 đầu)
    ...addressCols,                 // Tỉnh [+ Quận nếu 'old'] + Xã
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

// Giới hạn số dòng an toàn cho 1 lần xuất.
const MAX_ROWS = 2000;

/**
 * Xuất đơn ra file .xlsx tạo đơn hàng loạt SPX — file CHỈ 1 SHEET (đúng sheet SPX đọc), text
 * ghi dạng shared string. `resolved[i]` (nếu có) là Tỉnh/Xã đã giải sẵn (rule-based + AI) cho
 * orders[i]. Trả về số đơn đã ghi.
 */
export const exportOrdersToSpx = async (
  orders: Order[],
  opts: { weightKg?: number; addressMode?: SpxAddressMode; resolved?: ResolvedAddress[] } = {},
): Promise<number> => {
  const { weightKg = 1, addressMode = 'new', resolved } = opts;
  const list = orders.slice(0, MAX_ROWS);

  const aoa: (string | number)[][] = [
    SPX_HEADER[addressMode],
    ...list.map((o, i) => buildRow(o, weightKg, addressMode, resolved?.[i])),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = SPX_HEADER[addressMode].map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME[addressMode]);
  // bookSST: ghi text dạng shared string (giống Excel/SPX), tránh inlineStr.
  XLSX.writeFile(wb, `SPX_TaoDon_${new Date().toISOString().split('T')[0]}.xlsx`, {
    bookType: 'xlsx',
    bookSST: true,
  });
  return list.length;
};
