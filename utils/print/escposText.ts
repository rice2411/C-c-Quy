/**
 * Sinh ESC/POS TEXT-MODE (dùng font sẵn của máy in) cho bill khách + phiếu bếp — KHÔNG render ảnh.
 *
 * Vì sao text-mode (thay cho raster html-to-image):
 *  - In ảnh raster = mọi chữ thành chấm đen dày → kéo dòng đốt cao → máy in nhiệt tự ngắt USB
 *    (đặc biệt mảng đen đặc như QR) → tờ 2 ra ký tự rác. Text-mode nhẹ dòng hơn HẲN → không rớt.
 *  - Bỏ luôn html-to-image → hết bug canvas trắng / chụp lần đầu lỗi / lỗi font / workbox.
 *  - ESC 7 (giảm số chấm đốt cùng lúc) → giảm thêm xung dòng đỉnh.
 * Đánh đổi: font đơn giản, tiếng Việt in KHÔNG DẤU (bỏ dấu) cho chạy mọi code page; bỏ QR + logo.
 */
import type { Order, Product } from '@/types';
import { surchargeTagLabel } from '@/types/surchargeTag';
import { getDepositInfo } from '@/utils/order/orderUtils';
import { buildOrderItemRows } from '@/pages/Orders/orderItemRows';
import { SHOP_INFO } from '@/config/shopInfo';

const COLS = 32; // 58mm, font A = 32 ký tự/dòng

// ─── ESC/POS command bytes ───
const ESC = 0x1b;
const GS = 0x1d;
const INIT = [ESC, 0x40];
const LOW_CURRENT = [ESC, 0x37, 3, 200, 6]; // ESC 7: max 32 chấm/lần, heat 200, interval 6 → nhẹ dòng
const alignL = [ESC, 0x61, 0];
const alignC = [ESC, 0x61, 1];
const boldOn = [ESC, 0x45, 1];
const boldOff = [ESC, 0x45, 0];
const sizeNormal = [GS, 0x21, 0x00];
const sizeDouble = [GS, 0x21, 0x11]; // gấp đôi cả rộng + cao
const sizeTall = [GS, 0x21, 0x01]; // gấp đôi chiều cao (đọc rõ, đỡ tốn giấy)
const feed = (n: number) => [ESC, 0x64, n & 0xff];
const CUT = [GS, 0x56, 0x01];

/** Bỏ dấu tiếng Việt + loại ký tự ngoài ASCII in được (máy in font A chỉ chắc ăn với ASCII). */
function toAscii(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tổ hợp (á→a, ê→e...)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7e]/g, ''); // bỏ ký tự lạ còn sót (₫, emoji...)
}

/** Định dạng tiền VND thuần ASCII: 1.234.000d */
function money(n: number): string {
  const v = Math.round(Number(n) || 0);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'd';
}

/** Bộ gom byte + helper in text tiện dụng. */
class EscBuf {
  private out: number[] = [];
  raw(bytes: number[]): this {
    for (const b of bytes) this.out.push(b);
    return this;
  }
  text(s: string): this {
    const a = toAscii(s);
    for (let i = 0; i < a.length; i++) this.out.push(a.charCodeAt(i) & 0xff);
    return this;
  }
  line(s = ''): this {
    return this.text(s).raw([0x0a]);
  }
  /** 1 dòng 2 cột: nhãn trái + giá trị phải, chèn khoảng trắng cho đủ COLS. */
  row2(left: string, right: string): this {
    const l = toAscii(left);
    const r = toAscii(right);
    const gap = COLS - l.length - r.length;
    if (gap >= 1) return this.line(l + ' '.repeat(gap) + r);
    const maxL = Math.max(0, COLS - r.length - 1);
    return this.line(l.slice(0, maxL) + ' ' + r);
  }
  rule(ch = '-'): this {
    return this.line(ch.repeat(COLS));
  }
  bytes(): Uint8Array {
    return Uint8Array.from(this.out);
  }
}

export interface BillTextData {
  order: Order;
  products: Product[];
  subtotal: number;
  finalTotal: number;
  shippingCost: number;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  /** Nội dung CK (= mã đơn) — in dạng CHỮ thay cho QR. */
  description?: string;
}

/** Bill KHÁCH — text-mode, không QR/logo. */
export function buildBillText(d: BillTextData): Uint8Array {
  const { order, products, subtotal, finalTotal, shippingCost } = d;
  const b = new EscBuf();
  b.raw(INIT).raw(LOW_CURRENT);

  // Header tiệm
  b.raw(alignC).raw(boldOn).raw(sizeDouble).line(SHOP_INFO.name).raw(sizeNormal).raw(boldOff);
  if (SHOP_INFO.address) b.line(SHOP_INFO.address);
  if (SHOP_INFO.phone) b.line(`DT: ${SHOP_INFO.phone}`);
  b.rule();
  b.raw(boldOn).line('HOA DON BAN HANG').raw(boldOff);
  b.line(order.orderNumber || String(order.id));
  b.line(new Date(order.date || Date.now()).toLocaleString('vi-VN'));
  b.raw(alignL).rule();

  // Khách
  const c = order.customer;
  b.line(`Khach: ${c?.name || '-'}`);
  if (c?.phone) b.line(`SDT: ${c.phone}`);
  if (c?.address) b.line(`Dia chi: ${c.address}${c.city ? `, ${c.city}` : ''}`);
  if (order.coachInfo) {
    const coach = [order.coachInfo.name, order.coachInfo.phone, order.coachInfo.route, order.coachInfo.pickupPoint]
      .filter(Boolean)
      .join(' - ');
    if (coach) b.line(`Nha xe: ${coach}`);
  }
  if (order.deliveryDate) {
    const dd = `${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}${order.deliveryTime ? ` ${order.deliveryTime}` : ''}`;
    b.line(`Ngay giao: ${dd}`);
  }
  b.rule();

  // Món
  const rows = buildOrderItemRows(order.items, products);
  rows.forEach((r) => {
    const unitPrice = order.items.find((it) => r.key.startsWith(it.id))?.price ?? 0;
    b.raw(boldOn).line(r.name).raw(boldOff);
    if (r.meta.length) b.line(`  ${r.meta.join(' - ')}`);
    b.row2(`  ${r.qty} x ${money(unitPrice)}`, money(unitPrice * r.qty));
  });
  b.rule();

  // Tổng
  b.row2('Tam tinh', money(subtotal));
  const surcharges =
    order.surcharges && order.surcharges.length > 0
      ? order.surcharges
      : order.surchargeAmount
        ? [{ tag: order.surchargeTag, amount: order.surchargeAmount }]
        : [];
  surcharges
    .filter((s) => Number(s.amount) > 0)
    .forEach((s) => b.row2(`Phu thu${s.tag ? ` ${toAscii(surchargeTagLabel(s.tag))}` : ''}`, `+${money(Number(s.amount))}`));
  if (shippingCost > 0) b.row2('Phi ship', money(shippingCost));
  if (order.discountAmount && order.discountAmount > 0) b.row2('Khuyen mai', `-${money(order.discountAmount)}`);
  if (order.manualDiscountAmount && order.manualDiscountAmount > 0) b.row2('Giam gia', `-${money(order.manualDiscountAmount)}`);
  b.rule();
  b.raw(boldOn).raw(sizeTall).row2('TONG', money(finalTotal)).raw(sizeNormal).raw(boldOff);

  const dep = getDepositInfo(order, finalTotal);
  if (dep.show) {
    b.row2(`Da nhan (${toAscii(dep.statusLabel)})`, money(dep.deposit || dep.paid));
    if (dep.remaining > 0 && dep.paid < finalTotal) {
      b.raw(boldOn).row2('CON LAI', money(dep.remaining)).raw(boldOff);
    }
  }

  // Thông tin chuyển khoản dạng CHỮ (thay QR)
  if (d.accountNumber) {
    b.rule();
    b.raw(alignC).line('CHUYEN KHOAN');
    b.line(`${(d.bankCode || '').toUpperCase()} ${d.accountNumber}`.trim());
    if (d.accountHolder) b.line(d.accountHolder.toUpperCase());
    if (d.description) b.line(`ND: ${d.description}`);
    b.raw(alignL);
  }

  b.rule();
  b.raw(alignC).line('Cam on quy khach!');
  if (SHOP_INFO.social) b.line(SHOP_INFO.social);
  b.raw(alignL);

  b.raw(feed(3)).raw(CUT);
  return b.bytes();
}

/** Phiếu BẾP — text-mode, chữ TO, không giá/QR. */
export function buildKitchenText(order: Order, products: Product[]): Uint8Array {
  const b = new EscBuf();
  b.raw(INIT).raw(LOW_CURRENT);

  b.raw(alignC).raw(boldOn).raw(sizeDouble).line('PHIEU BEP');
  b.line(order.orderNumber || String(order.id)).raw(sizeNormal).raw(boldOff).raw(alignL);
  b.rule();

  b.line(`Dat luc: ${new Date(order.date || Date.now()).toLocaleString('vi-VN')}`);
  if (order.deliveryDate) {
    const dd = `${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}${order.deliveryTime ? ` ${order.deliveryTime}` : ''}`;
    b.raw(boldOn).raw(sizeTall).line(`GIAO: ${dd}`).raw(sizeNormal).raw(boldOff);
  }
  const c = order.customer;
  b.line(`Khach: ${c?.name || '-'}${c?.phone ? ` - ${c.phone}` : ''}`);
  b.rule();

  const rows = buildOrderItemRows(order.items, products);
  rows.forEach((r) => {
    b.raw(boldOn).raw(sizeTall).row2(r.name, `x${r.qty}`).raw(sizeNormal).raw(boldOff);
    if (r.meta.length) b.line(`  ${r.meta.join(' - ')}`);
  });

  if (order.note) {
    b.rule();
    b.raw(boldOn).line('GHI CHU:').line(order.note).raw(boldOff);
  }

  b.raw(feed(3)).raw(CUT);
  return b.bytes();
}
