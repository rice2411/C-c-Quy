import { Order, OrderFieldChange } from "@/types";
import { parseDateValue } from "../format/dateUtil";
import { formatVND } from "../format/currencyUtil";
import { formatItemsDiff } from "@/utils/order/itemsDiff";
import { getOrderTotal } from "../order/orderUtils";

const DIVIDER = '─────────────────────────';

/** Nhãn size gộp, số lượng đứng TRƯỚC tên: "2 số, 3 mặt chã" (bỏ qty 0, bỏ "1"). */
const sizeCountsInline = (sc?: { name: string; qty: number }[]): string =>
  (sc ?? [])
    .filter((x) => x.qty > 0)
    .map((x) => (x.qty > 1 ? `${x.qty} ${x.name}` : x.name))
    .join(', ');

/**
 * Nhãn 1 món cho noti Zalo: `Tên ×SL (chi tiết)` — số lượng đứng NGAY SAU tên (rõ
 * "2 combo, mỗi combo …"), chi tiết = size/sizeCounts + vị gom chung trong 1 ngoặc,
 * số lượng vị/size đứng trước tên (vd "Combo tình bạn ×2 (2 số, 3 mặt chã, 2 socola)").
 * Ẩn "×1" thừa; không có chi tiết thì chỉ tên.
 */
const itemLabel = (it: any): string => {
  const qty = it?.quantity || 0;
  let s = it?.name ?? '';
  if (qty > 1) s += ` ×${qty}`;
  const detail: string[] = [];
  const sc = sizeCountsInline(it?.sizeCounts);
  if (sc) detail.push(sc);
  else if (it?.size) detail.push(it.size);
  if (Array.isArray(it?.flavors) && it.flavors.length) {
    const m = new Map<string, number>();
    it.flavors.forEach((f: string) => m.set(f, (m.get(f) || 0) + 1));
    detail.push(...Array.from(m.entries()).map(([n, q]) => (q > 1 ? `${q} ${n}` : n)));
  }
  if (detail.length) s += ` (${detail.join(', ')})`;
  return s;
};

/** Gộp danh sách món thành 1 dòng ngắn: "Bánh kem ×1, Cupcake ×6" (cắt bớt nếu quá dài). */
const itemsInline = (items: any[] | undefined, max = 6): string => {
  const list = items || [];
  if (list.length === 0) return '(không có)';
  const parts = list.slice(0, max).map((it) => `${it.name || '(?)'} ×${it.quantity || 0}`);
  if (list.length > max) parts.push(`…+${list.length - max}`);
  return parts.join(', ');
};

export const formatDate = (date: Date | null): string => {
  if (!date) return '(không có)';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format ngày tất định (tránh locale vi-VN đảo giờ/ngày khi bỏ year).
const p2 = (n: number): string => String(n).padStart(2, '0');
/** dd/MM/yy */
const dmy = (d: Date): string => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
/** dd/MM */
const dm = (d: Date): string => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
/** HH:mm */
const hm = (d: Date): string => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

/** "dd/MM/yy HH:mm" — giữ shape cũ (nơi khác .split(' ')[0] lấy phần ngày). */
const formatDateShort = (date: Date | null): string => (date ? `${dmy(date)} ${hm(date)}` : '—');

/** Ngày + giờ gọn cho danh sách (không năm): "07/07 14:00". */
const formatDayHM = (date: Date | null): string => (date ? `${dm(date)} ${hm(date)}` : '—');

/** Dòng khách gọn: "Nguyễn A · 0901234567" (bỏ phần thiếu). */
const customerLine = (name?: string, phone?: string): string =>
  [name || '(không có)', phone || ''].filter(Boolean).join(' · ');

const deliveryTypeLabel = (dt: string | undefined): string => {
  if (dt === 'PICKUP') return 'Khách qua lấy';
  if (dt === 'SHIP_PROVINCE') return 'Ship tỉnh';
  return 'Ship';
};

// ============== NEW ORDER ==============
export const formatOrderMessage = (order: any): string => {
  const deliveryDate = order.deliveryDate ? parseDateValue(order.deliveryDate) : null;
  const totalItems = order.items?.reduce((s: number, it: any) => s + (it.quantity || 0), 0) || 0;
  const subtotal = (order.items || []).reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0);
  const shipping = order.shippingCost || 0;
  const surcharge = Number(order.surchargeAmount || 0);
  const total = getOrderTotal(order);

  const lines: string[] = [];
  if (order.isTest) lines.push('⚠️ ĐƠN HÀNG TEST');
  lines.push(`🟢 ĐƠN MỚI · ${order.orderNumber || order.id}`);
  lines.push(DIVIDER);
  lines.push(`👤 ${customerLine(order.customer?.name, order.customer?.phone)}`);

  const giao = deliveryDate
    ? `${dmy(deliveryDate)}${order.deliveryTime ? ' ' + order.deliveryTime : ' ' + hm(deliveryDate)}`
    : '—';
  lines.push(`🚚 Giao: ${giao} · ${deliveryTypeLabel(order.deliveryType)}`);
  if (order.deliveryType !== 'PICKUP' && order.customer?.address) {
    lines.push(`🏠 ${order.customer.address}`);
  }

  lines.push(`📋 Sản phẩm (${totalItems}):`);
  if (order.items && order.items.length > 0) {
    order.items.forEach((it: any) => lines.push(` • ${itemLabel(it)}`));
  } else {
    lines.push(' (không có)');
  }

  const money = [`Hàng ${formatVND(subtotal)}`];
  if (shipping > 0) money.push(`Ship ${formatVND(shipping)}`);
  if (surcharge > 0) money.push(`Phụ thu ${formatVND(surcharge)}`);
  lines.push(`💰 ${money.join(' · ')}`);
  lines.push(`💵 TỔNG: ${formatVND(total)}`);
  if (order.note) lines.push(`💬 ${order.note}`);
  return lines.join('\n');
};

// ============== UPDATE ORDER ==============
export interface OrderUpdateEditorInfo {
  name?: string;
  uid?: string;
}

export const formatOrderUpdateMessage = (
  order: any,
  changes: OrderFieldChange[],
  editor?: OrderUpdateEditorInfo,
  itemsDiff?: import('@/utils/order/itemsDiff').ItemChangeEntry[],
  _prevOrder?: any,
): string => {
  const lines: string[] = [];
  if (order.isTest) lines.push('⚠️ ĐƠN HÀNG TEST');
  lines.push(`🟡 CẬP NHẬT · ${order.orderNumber || order.id}`);
  lines.push(DIVIDER);
  const cust = order.customer?.name || order.customerName || '(không có)';
  lines.push(`👤 ${cust} · ✏️ ${editor?.name || 'Unknown'} · 🕒 ${formatDayHM(new Date())}`);

  lines.push(`📝 Thay đổi (${changes.length}):`);
  changes.forEach((c) => {
    const label = c.label || c.field;
    if (c.field === 'items' && itemsDiff && itemsDiff.length > 0) {
      lines.push(` • ${label} (${itemsDiff.length}):`);
      formatItemsDiff(itemsDiff).forEach((d) => lines.push(`   ${d}`));
      return;
    }
    const oldV = c.oldValue == null || c.oldValue === '' ? '—' : String(c.oldValue);
    const newV = c.newValue == null || c.newValue === '' ? '—' : String(c.newValue);
    lines.push(` • ${label}: ${oldV} → ${newV}`);
  });

  lines.push(`💵 Tổng mới: ${formatVND(getOrderTotal(order))}`);
  return lines.join('\n');
};

// ============== DELETE ORDER ==============
export const formatOrderDeleteMessage = (
  order: any,
  editor?: OrderUpdateEditorInfo,
): string => {
  const lines: string[] = [];
  if (order.isTest) lines.push('⚠️ ĐƠN HÀNG TEST');
  lines.push(`🔴 XOÁ ĐƠN · ${order.orderNumber || order.id}`);
  lines.push(DIVIDER);
  const custName = order.customer?.name || order.customerName || '(không có)';
  const phone = order.customer?.phone || order.phone || '';
  lines.push(`👤 ${customerLine(custName, phone)}`);
  lines.push(`🗑️ ${editor?.name || 'Unknown'} · 🕒 ${formatDayHM(new Date())}`);
  lines.push(`💵 Giá trị: ${formatVND(getOrderTotal(order))}`);
  return lines.join('\n');
};

// ============== BATCH REMINDERS ==============
export const formatUnpaidOrdersMessage = (orders: Order[]): string => {
  // Defensive: loại đơn đã huỷ / trả lại — không tính là chưa TT
  const filtered = orders.filter((o) => {
    const st = String(o.status ?? '').toUpperCase();
    return st !== 'CANCELLED' && st !== 'RETURNED';
  });
  if (filtered.length === 0) return `✅ Không có đơn hàng chưa thanh toán.`;
  const totalUnpaid = filtered.reduce((s, o) => s + getOrderTotal(o), 0);
  const lines: string[] = [];
  lines.push(`⚠️ ĐƠN CHƯA THANH TOÁN · ${filtered.length} đơn · ${formatVND(totalUnpaid)}`);
  lines.push(DIVIDER);
  filtered.forEach((o, i) => {
    const od = parseDateValue(o.orderDate || o.date);
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))} · ${customerLine(o.customer?.name, o.customer?.phone)}`);
    lines.push(`   🕒 Đặt ${formatDayHM(od)}`);
  });
  return lines.join('\n');
};

export const formatPendingOrdersMessage = (orders: Order[]): string => {
  if (orders.length === 0) return `✅ Không có đơn hàng cần xử lý.`;
  const totalPending = orders.reduce((s, o) => s + getOrderTotal(o), 0);
  const lines: string[] = [];
  lines.push(`⚠️ ĐƠN CẦN XỬ LÝ · ${orders.length} đơn · ${formatVND(totalPending)}`);
  lines.push(DIVIDER);
  orders.forEach((o, i) => {
    const dd = o.deliveryDate ? parseDateValue(o.deliveryDate) : null;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))} · ${customerLine(o.customer?.name, o.customer?.phone)}`);
    const giao = dd ? `📅 Giao ${dm(dd)}${o.deliveryTime ? ' ' + o.deliveryTime : ' ' + hm(dd)} · ` : '';
    lines.push(`   ${giao}📦 ${itemsInline(o.items)}`);
  });
  return lines.join('\n');
};

export const formatDeliveryDueMessage = (orders: Order[], targetDate?: Date): string => {
  const dateStr = targetDate ? formatDateShort(targetDate).split(' ')[0] : 'hôm nay';
  if (orders.length === 0) return `✅ Không có đơn hàng cần giao vào ${dateStr}.`;
  const lines: string[] = [];
  lines.push(`🚚 ĐƠN CẦN GIAO · ${dateStr} · ${orders.length} đơn`);
  lines.push(DIVIDER);
  orders.forEach((o, i) => {
    const dd = o.deliveryDate ? parseDateValue(o.deliveryDate) : null;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))} · ${customerLine(o.customer?.name, o.customer?.phone)}`);
    if (o.customer?.address) lines.push(`   🏠 ${o.customer.address}`);
    const giao = dd ? `📅 ${dm(dd)}${o.deliveryTime ? ' ' + o.deliveryTime : ' ' + hm(dd)} · ` : '';
    lines.push(`   ${giao}📦 ${itemsInline(o.items)}`);
  });
  return lines.join('\n');
};

export const formatPaymentReceivedMessage = (orderNumber: string | null, transactionAmount: number): string => {
  const lines: string[] = [];
  lines.push(`💰 ĐÃ NHẬN THANH TOÁN${orderNumber ? ' · ' + orderNumber : ''}`);
  lines.push(DIVIDER);
  lines.push(`💵 ${formatVND(transactionAmount)}`);
  lines.push('✅ ĐÃ THANH TOÁN');
  return lines.join('\n');
};

// ============== PRODUCTION TOMORROW ==============
export const formatProductionTomorrowMessage = (orders: Order[], targetDate: Date): string => {
  const dateStr = formatDateShort(targetDate).split(' ')[0];
  if (orders.length === 0) return `✅ Mai (${dateStr}) chưa có đơn nào cần làm.`;

  // Gộp items theo name + quantity
  const itemMap = new Map<string, number>();
  let totalItems = 0;
  orders.forEach((o) => {
    (o.items || []).forEach((it: any) => {
      const key = it.name || '(?)';
      const qty = it.quantity || 0;
      itemMap.set(key, (itemMap.get(key) || 0) + qty);
      totalItems += qty;
    });
  });

  const sortedItems = Array.from(itemMap.entries()).sort((a, b) => b[1] - a[1]);

  const lines: string[] = [];
  lines.push(`🍰 SẢN XUẤT NGÀY MAI · ${dateStr}`);
  lines.push(DIVIDER);
  lines.push(`📊 ${orders.length} đơn · ${totalItems} sản phẩm`);
  lines.push('');
  sortedItems.forEach(([name, qty]) => {
    lines.push(`• ${name} × ${qty}`);
  });
  return lines.join('\n');
};

// ============== STUCK PENDING (đơn PENDING quá lâu) ==============
export const formatStuckPendingMessage = (orders: Order[], thresholdHours: number): string => {
  if (orders.length === 0) return `✅ Không có đơn PENDING nào quá ${thresholdHours} giờ.`;
  const lines: string[] = [];
  lines.push(`⚠️ ĐƠN PENDING QUÁ ${thresholdHours}H · ${orders.length} đơn`);
  lines.push(DIVIDER);
  const now = Date.now();
  orders.forEach((o, i) => {
    const created = parseDateValue(o.orderDate || o.createdAt || (o as any).date);
    const ageH = created ? Math.floor((now - created.getTime()) / 3600000) : null;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))} · ${customerLine(o.customer?.name, o.customer?.phone)}`);
    if (created) lines.push(`   ⏰ Tạo ${formatDayHM(created)}${ageH != null ? ` (${ageH}h trước)` : ''}`);
  });
  return lines.join('\n');
};

// ============== DAILY SUMMARY ==============
export interface DailySummaryStats {
  orders: Order[];
  newCustomersCount?: number;
}
export const formatDailySummaryMessage = (stats: DailySummaryStats, date: Date): string => {
  const dateStr = formatDateShort(date).split(' ')[0];
  const orders = stats.orders;
  const revenue = orders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Đếm trạng thái thanh toán
  const paid = orders.filter((o) => o.paymentStatus === 'PAID').length;
  const unpaid = orders.length - paid;

  // Top sản phẩm
  const itemMap = new Map<string, number>();
  orders.forEach((o) => {
    (o.items || []).forEach((it: any) => {
      const k = it.name || '(?)';
      itemMap.set(k, (itemMap.get(k) || 0) + (it.quantity || 0));
    });
  });
  const topItems = Array.from(itemMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines: string[] = [];
  lines.push(`📊 TỔNG KẾT HÔM NAY · ${dateStr}`);
  lines.push(DIVIDER);
  lines.push(`📦 Đơn: ${orders.length}`);
  lines.push(`💵 Doanh thu: ${formatVND(revenue)}`);
  if (stats.newCustomersCount !== undefined) {
    lines.push(`👥 KH mới: ${stats.newCustomersCount}`);
  }
  lines.push(`💳 Đã TT: ${paid} · Chưa TT: ${unpaid}`);
  if (topItems.length > 0) {
    lines.push('');
    lines.push(`🏆 Top sản phẩm:`);
    topItems.forEach(([name, qty], i) => {
      lines.push(`   ${i + 1}. ${name} × ${qty}`);
    });
  }
  return lines.join('\n');
};

// ============== HEALTH CHECK ==============
export const formatHealthCheckMessage = (now: Date): string => {
  const timeStr = now.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const lines: string[] = [];
  lines.push(`✅ HEALTH CHECK · ${timeStr}`);
  lines.push(DIVIDER);
  lines.push('Hệ thống đang hoạt động bình thường.');
  lines.push('Zalo token: live ✓');
  return lines.join('\n');
}
