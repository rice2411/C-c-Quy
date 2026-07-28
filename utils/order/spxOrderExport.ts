import JSZip from 'jszip';
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

// File worksheet trong nền (file upload-OK): sheet1.xml = "Tạo đơn (địa chỉ cũ)" (SHEET ĐẦU —
// SPX đọc sheet này), sheet2.xml = "Tạo đơn (địa chỉ mới)".
const SHEET_FILE: Record<SpxAddressMode, string> = {
  old: 'xl/worksheets/sheet1.xml',
  new: 'xl/worksheets/sheet2.xml',
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
    cod > 0 ? cod : '',             // Số tiền COD
    'N',                            // bưu gửi giá trị cao
    'Người gửi trả',                // Hình thức thanh Toán
    o.note || '',                   // Lưu ý giao hàng
    '',                             // Nhắc nhở điền đúng số tiền COD
    '',                             // Đơn chỉ hoàn thành nếu "Đủ điều kiện"
  ];
};

/** Chỉ số cột (0=A) → chữ cái cột Excel. */
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

const MAX_ROWS = 2000;

/**
 * Xuất đơn ra file tạo đơn hàng loạt SPX bằng cách MỔ file NỀN = file đã upload thành công (Google
 * xuất, SPX chắc chắn nhận). Dùng JSZip: giữ nguyên toàn bộ cấu trúc, chỉ thay data trong sheet
 * "Tạo đơn (địa chỉ cũ)" (sheet đầu) + xoá data mẫu ở sheet còn lại. Text ghi shared string.
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
  const zip = await JSZip.loadAsync(bytes);

  const dataSheet = SHEET_FILE[addressMode];
  const otherSheet = SHEET_FILE[addressMode === 'old' ? 'new' : 'old'];

  const ssFile = zip.file(SHARED_STRINGS);
  if (!ssFile) throw new Error('Nền SPX thiếu sharedStrings.xml.');
  let ss = await ssFile.async('string');
  const sstOpen = ss.match(/<sst[^>]*>/)?.[0] ?? '';
  const count = parseInt(sstOpen.match(/\bcount="(\d+)"/)?.[1] ?? '0', 10);
  const unique = parseInt(sstOpen.match(/\buniqueCount="(\d+)"/)?.[1] ?? '0', 10);
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

  // Thay toàn bộ dòng data (giữ header dòng 1) của 1 sheet bằng `rows` (rỗng = xoá sạch data mẫu).
  const fillSheet = async (path: string, rows: (string | number)[][]): Promise<void> => {
    const f = zip.file(path);
    if (!f) return;
    const xml = await f.async('string');
    const sd = xml.indexOf('<sheetData>');
    if (sd < 0) return;
    const r1End = xml.indexOf('</row>', sd) + '</row>'.length;
    const sdClose = xml.indexOf('</sheetData>', r1End);
    if (r1End < 6 || sdClose < 0) return;
    let body = '';
    rows.forEach((vals, ri) => {
      const r = ri + 2;
      let cells = '';
      vals.forEach((v, c) => {
        if (v === '' || v === null || v === undefined) return;
        const ref = `${colLetter(c)}${r}`;
        cells +=
          typeof v === 'number'
            ? `<c r="${ref}"><v>${v}</v></c>`
            : `<c r="${ref}" t="s"><v>${(refsAdded++, internString(String(v)))}</v></c>`;
      });
      body += `<row r="${r}">${cells}</row>`;
    });
    zip.file(path, xml.slice(0, r1End) + body + xml.slice(sdClose));
  };

  const list = orders.slice(0, MAX_ROWS);
  const rows = list.map((o, i) => buildRow(o, weightKg, addressMode, resolved?.[i]));
  await fillSheet(dataSheet, rows);
  await fillSheet(otherSheet, []); // xoá data mẫu ở sheet còn lại (tránh tạo đơn thừa)

  if (addedSi.length > 0) {
    ss = ss
      .replace(/(<sst[^>]*\bcount=")\d+(")/, `$1${count + refsAdded}$2`)
      .replace(/(<sst[^>]*\buniqueCount=")\d+(")/, `$1${nextIndex}$2`)
      .replace('</sst>', `${addedSi.join('')}</sst>`);
  }
  zip.file(SHARED_STRINGS, ss);

  const out = await zip.generateAsync({ type: 'uint8array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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
