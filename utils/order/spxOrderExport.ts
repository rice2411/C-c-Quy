import * as XLSX from 'xlsx-js-style';
import { Order, DeliveryType, OrderStatus } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { matchAddress } from '@/utils/order/spxAddressMatch';

/** Định dạng địa chỉ SPX: 'new' = 2 cấp (Tỉnh/Xã), 'old' = 3 cấp (Tỉnh/Quận/Xã). */
export type SpxAddressMode = 'new' | 'old';

/** Tỉnh/Xã đã giải sẵn cho 1 đơn (rule-based hoặc AI). */
export interface ResolvedAddress {
  province: string;
  ward: string;
}

// Sheet điền data (template có sẵn header dòng 1). File upload thành công của user để data ở
// "Tạo đơn (địa chỉ cũ)" (sheet ĐẦU) → mặc định ghi vào đó.
const SHEET_NAME: Record<SpxAddressMode, string> = {
  old: 'Tạo đơn (địa chỉ cũ)',
  new: 'Tạo đơn (địa chỉ mới)',
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

  const { province, ward } = resolved ?? matchAddress(detailAddress);
  // 'old' = Tỉnh + Quận (để trống) + Xã; 'new' = Tỉnh + Xã.
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
 * Xuất đơn ra file .xlsx tạo đơn hàng loạt SPX. Đọc template gốc rồi GHI LẠI bằng thư viện để
 * BỎ các thẻ riêng của WPS (namespace dbsheet…) — so 2 file cho thấy SPX chỉ nhận file "sạch"
 * (kiểu Excel/Google), từ chối file WPS gốc; đồng thời data phải ở sheet ĐẦU "Tạo đơn (địa chỉ cũ)".
 * Giữ đủ 9 sheet (gồm sheet danh mục ẩn). Text ghi dạng shared string (bookSST).
 * `resolved[i]` (nếu có) là Tỉnh/Xã đã giải sẵn (rule-based + AI) cho orders[i]. Trả về số đơn.
 */
export const exportOrdersToSpx = async (
  orders: Order[],
  opts: { weightKg?: number; addressMode?: SpxAddressMode; resolved?: ResolvedAddress[] } = {},
): Promise<number> => {
  const { weightKg = 1, addressMode = 'old', resolved } = opts;

  const { SPX_TEMPLATE_B64 } = await import('@/assets/spxTemplateBase64');
  const bin = atob(SPX_TEMPLATE_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const wb = XLSX.read(bytes, { type: 'array' });

  const sheetName = SHEET_NAME[addressMode];
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Template SPX thiếu sheet "${sheetName}".`);

  const list = orders.slice(0, MAX_ROWS);
  const rows = list.map((o, i) => buildRow(o, weightKg, addressMode, resolved?.[i]));
  // Ghi data từ dòng 2 (giữ header dòng 1 của template).
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A2' });

  XLSX.writeFile(wb, `SPX_TaoDon_${new Date().toISOString().split('T')[0]}.xlsx`, {
    bookType: 'xlsx',
    bookSST: true,
  });
  return list.length;
};
