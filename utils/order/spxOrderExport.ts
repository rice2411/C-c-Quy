import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
import { Order, DeliveryType, OrderStatus } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { matchAddress } from '@/utils/order/spxAddressMatch';

/** Định dạng địa chỉ SPX: 'new' = 2 cấp (Tỉnh/Xã, sau sáp nhập 2025), 'old' = 3 cấp (Tỉnh/Quận/Xã). */
export type SpxAddressMode = 'new' | 'old';

// File worksheet trong template gốc (xác định qua workbook.xml.rels):
//   rId1 = sheet1.xml = "Tạo đơn (địa chỉ cũ)"; rId2 = sheet2.xml = "Tạo đơn (địa chỉ mới)".
const SHEET_FILE: Record<SpxAddressMode, string> = {
  new: 'xl/worksheets/sheet2.xml',
  old: 'xl/worksheets/sheet1.xml',
};
const SHARED_STRINGS = 'xl/sharedStrings.xml';

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

  // Tự tách Tỉnh + Xã (khớp list chuẩn SPX). Không khớp → '' để chọn tay trên SPX.
  // 'new' = Tỉnh + Xã; 'old' = Tỉnh + Quận (để trống) + Xã.
  const { province, ward } = matchAddress(detailAddress);
  const addressCols = mode === 'old' ? [province, '', ward] : [province, ward];

  return [
    o.orderNumber || o.id,          // Mã đơn hàng
    o.customer.name || '',          // Tên người nhận
    String(o.customer.phone || ''), // Số điện thoại
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
    '',                             // Nhắc nhở (cột công thức — giữ nguyên)
    '',                             // Đơn chỉ hoàn thành nếu "Đủ điều kiện" (công thức)
  ];
};

/** Chỉ số cột (0=A) → chữ cái cột Excel (A, B, ..., Z, AA, AB, ...). */
const colLetter = (i: number): string => {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const triggerDownload = (bytes: Uint8Array, fileName: string): void => {
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Số dòng data tối đa (template dựng sẵn dòng 2..995 kèm dropdown/format).
const MAX_ROWS = 994;

/**
 * Xuất đơn ra file tạo đơn hàng loạt SPX bằng cách MỔ TRỰC TIẾP file zip .xlsx của template gốc:
 * thay các cell rỗng (giữ style) trong đúng 1 sheet + thêm chuỗi vào sharedStrings, giữ nguyên byte
 * các phần còn lại (dropdown, data-validation, công thức). QUAN TRỌNG:
 *  - Text ghi dạng SHARED STRING (t="s") giống hệt Excel/SPX — dùng inlineStr hoặc ghi lại bằng thư
 *    viện xlsx đều làm SPX báo "Tải không thành công".
 * Trả về số đơn đã ghi.
 */
export const exportOrdersToSpx = async (
  orders: Order[],
  opts: { weightKg?: number; addressMode?: SpxAddressMode } = {},
): Promise<number> => {
  const { weightKg = 1, addressMode = 'new' } = opts;

  // Template nhúng base64 (lazy chunk) — KHÔNG fetch runtime (service worker PWA có thể trả nhầm HTML).
  const { SPX_TEMPLATE_B64 } = await import('@/assets/spxTemplateBase64');
  const bin = atob(SPX_TEMPLATE_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const files = unzipSync(bytes);
  const sheetPath = SHEET_FILE[addressMode];
  if (!files[sheetPath]) throw new Error(`Template SPX thiếu ${sheetPath}.`);
  if (!files[SHARED_STRINGS]) throw new Error('Template SPX thiếu sharedStrings.xml.');

  let xml = strFromU8(files[sheetPath]);
  let ss = strFromU8(files[SHARED_STRINGS]);

  // Bộ nạp chuỗi vào sharedStrings: dedupe các chuỗi mới, trả index để cell tham chiếu t="s".
  const sstOpen = ss.match(/<sst[^>]*>/)?.[0] ?? '';
  let count = parseInt(sstOpen.match(/\bcount="(\d+)"/)?.[1] ?? '0', 10);
  let unique = parseInt(sstOpen.match(/\buniqueCount="(\d+)"/)?.[1] ?? '0', 10);
  let nextIndex = unique;
  const addedSi: string[] = [];
  const strIndex = new Map<string, number>();
  let refsAdded = 0;
  const internString = (s: string): number => {
    const existing = strIndex.get(s);
    if (existing !== undefined) return existing;
    const idx = nextIndex++;
    strIndex.set(s, idx);
    addedSi.push(`<si><t xml:space="preserve">${escapeXml(s)}</t></si>`);
    return idx;
  };

  const list = orders.slice(0, MAX_ROWS);
  list.forEach((o, idx) => {
    const r = idx + 2; // dòng 1 = header
    buildRow(o, weightKg, addressMode).forEach((v, c) => {
      if (v === '' || v === null || v === undefined) return; // để trống → giữ cell template
      const ref = `${colLetter(c)}${r}`;
      const re = new RegExp(`<c r="${ref}"([^>]*?)/>`); // cell rỗng tự đóng, giữ style ở group 1
      const m = xml.match(re);
      if (!m) return; // cell không dựng sẵn (hiếm) → bỏ qua an toàn
      const attrs = m[1];
      const cell =
        typeof v === 'number'
          ? `<c r="${ref}"${attrs}><v>${v}</v></c>`
          : `<c r="${ref}"${attrs} t="s"><v>${(refsAdded++, internString(String(v)))}</v></c>`;
      xml = xml.replace(re, cell);
    });
  });

  if (addedSi.length > 0) {
    ss = ss
      .replace(/(<sst[^>]*\bcount=")\d+(")/, `$1${count + refsAdded}$2`)
      .replace(/(<sst[^>]*\buniqueCount=")\d+(")/, `$1${nextIndex}$2`)
      .replace('</sst>', `${addedSi.join('')}</sst>`);
    files[SHARED_STRINGS] = strToU8(ss);
  }
  files[sheetPath] = strToU8(xml);

  const out = zipSync(files);
  triggerDownload(out, `SPX_TaoDon_${new Date().toISOString().split('T')[0]}.xlsx`);
  return list.length;
};
