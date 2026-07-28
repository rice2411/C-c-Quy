import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
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

// File worksheet trong template (workbook.xml.rels): sheet1 = "Tạo đơn (địa chỉ cũ)" (SHEET ĐẦU
// — file upload thành công của user luôn để data ở đây), sheet2 = "Tạo đơn (địa chỉ mới)".
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

const MAX_ROWS = 994;

/**
 * Xuất đơn ra file tạo đơn hàng loạt SPX bằng cách MỔ TRỰC TIẾP file zip template gốc:
 * giữ NGUYÊN mọi part (đủ 9 sheet, sheet danh mục ẩn, drawings, validation...) — chỉ thay các
 * cell rỗng trong đúng 1 sheet + thêm chuỗi vào sharedStrings. So sánh với file upload thành công
 * cho thấy: (1) SPX cần file đủ cấu trúc template (thư viện ghi lại cắt part → hỏng); (2) data
 * phải ở sheet ĐẦU "Tạo đơn (địa chỉ cũ)". Text ghi dạng SHARED STRING. Trả về số đơn đã ghi.
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

  const files = unzipSync(bytes);
  const sheetPath = SHEET_FILE[addressMode];
  if (!files[sheetPath]) throw new Error(`Template SPX thiếu ${sheetPath}.`);
  if (!files[SHARED_STRINGS]) throw new Error('Template SPX thiếu sharedStrings.xml.');

  let xml = strFromU8(files[sheetPath]);
  let ss = strFromU8(files[SHARED_STRINGS]);

  // Bộ nạp shared string: dedupe chuỗi mới, trả index để cell tham chiếu t="s".
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

  const list = orders.slice(0, MAX_ROWS);
  list.forEach((o, idx) => {
    const r = idx + 2; // dòng 1 = header
    buildRow(o, weightKg, addressMode, resolved?.[idx]).forEach((v, c) => {
      if (v === '' || v === null || v === undefined) return;
      const ref = `${colLetter(c)}${r}`;
      const re = new RegExp(`<c r="${ref}"([^>]*?)/>`); // cell rỗng tự đóng, giữ style ở group 1
      const m = xml.match(re);
      const attrs = m ? m[1] : '';
      const cell =
        typeof v === 'number'
          ? `<c r="${ref}"${attrs}><v>${v}</v></c>`
          : `<c r="${ref}"${attrs} t="s"><v>${(refsAdded++, internString(String(v)))}</v></c>`;
      if (m) {
        xml = xml.replace(re, cell);
      } else {
        // Cell chưa dựng sẵn → chèn trước </row> của đúng dòng.
        const rowRe = new RegExp(`(<row r="${r}"[^>]*>)([\\s\\S]*?)(</row>)`);
        if (rowRe.test(xml)) xml = xml.replace(rowRe, (_a, open, inner, close) => open + inner + cell + close);
      }
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
