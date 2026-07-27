import * as XLSX from 'xlsx-js-style';
import { Order, DeliveryType, OrderStatus } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';

/** Định dạng địa chỉ SPX: 'new' = 2 cấp (Tỉnh/Xã, sau sáp nhập 2025), 'old' = 3 cấp (Tỉnh/Quận/Xã). */
export type SpxAddressMode = 'new' | 'old';

const SHEET_BY_MODE: Record<SpxAddressMode, string> = {
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
const buildRow = (o: Order, weightKg: number, mode: SpxAddressMode): (string | number)[] => {
  const cod = codRemaining(o);
  const productName = (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ');
  const detailAddress = [o.customer.address, o.customer.city].filter(Boolean).join(', ');

  // Phần đầu khác nhau: 'new' = Tỉnh + Xã; 'old' = Tỉnh + Quận + Xã.
  const addressCols =
    mode === 'old'
      ? [o.customer.city || '', '', ''] // Tỉnh (đoán) / Quận (chọn trên SPX) / Xã (chọn trên SPX)
      : [o.customer.city || '', '']; // Tỉnh (đoán) / Xã (chọn trên SPX)

  return [
    o.orderNumber || o.id,          // *Mã đơn hàng
    o.customer.name || '',          // *Tên người nhận
    String(o.customer.phone || ''), // *Số điện thoại
    ...addressCols,                 // *Tỉnh/Thành [+ *Quận/Huyện nếu 'old'] + *Xã/Phường
    detailAddress,                  // *Địa chỉ chi tiết
    '',                             // Lưu ý về địa chỉ
    '',                             // Mã bưu chính
    productName,                    // *Tên sản phẩm
    '',                             // Số lượng (không bắt buộc khi Giao 1 phần = N)
    '',                             // Giá tiền
    weightKg,                       // *Tổng cân nặng (KG)
    '',                             // Chiều dài
    '',                             // Chiều rộng
    '',                             // Chiều cao
    '',                             // Mã khách hàng
    getOrderTotal(o),               // *Giá trị đơn hàng
    'N',                            // *Giao hàng một phần
    'N',                            // *Cho phép thử hàng
    'Y',                            // *Cho xem hàng, không cho thử
    'N',                            // Thu phí từ chối nhận hàng
    '',                             // Phí từ chối nhận hàng cần thu
    cod > 0 ? 'Y' : 'N',            // *Thu COD
    cod > 0 ? cod : '',             // Số tiền COD (còn lại phải thu)
    'N',                            // bưu gửi giá trị cao
    'Người gửi trả',                // *Hình thức thanh Toán
    o.note || '',                   // Lưu ý giao hàng
    '',                             // Nhắc nhở điền đúng số tiền COD
    '',                             // Đơn chỉ hoàn thành nếu "Đủ điều kiện"
  ];
};

/**
 * Xuất đơn ra file tạo đơn hàng loạt SPX bằng cách GHI DỮ LIỆU VÀO CHÍNH TEMPLATE GỐC
 * (public/spx_order_template.xlsx) — giữ nguyên các sheet danh mục + cấu trúc SPX yêu cầu,
 * nếu tạo file mới từ đầu SPX sẽ báo "Tải không thành công".
 * Ghi từ dòng 2 của sheet theo chế độ địa chỉ, giữ nguyên header dòng 1. Trả về số đơn đã ghi.
 */
export const exportOrdersToSpx = async (
  orders: Order[],
  opts: { weightKg?: number; addressMode?: SpxAddressMode } = {},
): Promise<number> => {
  const { weightKg = 1, addressMode = 'new' } = opts;

  const res = await fetch(`${import.meta.env.BASE_URL}spx_order_template.xlsx`);
  if (!res.ok) throw new Error('Không tải được template SPX gốc.');
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const sheetName = SHEET_BY_MODE[addressMode];
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Template SPX thiếu sheet "${sheetName}".`);

  const rows = orders.map((o) => buildRow(o, weightKg, addressMode));
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A2' }); // giữ header dòng 1, ghi data từ dòng 2

  XLSX.writeFile(wb, `SPX_TaoDon_${new Date().toISOString().split('T')[0]}.xlsx`);
  return orders.length;
};
