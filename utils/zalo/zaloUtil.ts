import { Order, OrderFieldChange } from "@/types";
import { surchargeTagLabel } from "@/types/order";
import { parseDateValue } from "../format/dateUtil";
import { formatVND } from "../format/currencyUtil";
import { formatItemsDiff } from "@/utils/order/itemsDiff";
import { allocateSurcharge, getOrderTotal } from "../order/orderUtils";

const DIVIDER = '─────────────────────────';

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

const formatDateShort = (date: Date | null): string => {
  if (!date) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const deliveryTypeLabel = (dt: string | undefined): string => {
  if (dt === 'PICKUP') return 'Khách qua lấy';
  if (dt === 'SHIP_PROVINCE') return 'Ship tỉnh';
  return 'Ship';
};

// ============== NEW ORDER ==============
export const formatOrderMessage = (order: any): string => {
  const orderDate = parseDateValue(order.orderDate || order.date);
  const deliveryDate = order.deliveryDate ? parseDateValue(order.deliveryDate) : null;
  const totalItems = order.items?.reduce((s: number, it: any) => s + (it.quantity || 0), 0) || 0;
  const subtotal = (order.items || []).reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0);
  const shipping = order.shippingCost || 0;
  const total = getOrderTotal(order);

  const lines: string[] = [];
  if (order.isTest) lines.push('⚠️ ĐƠN HÀNG TEST');
  lines.push(`🟢 ĐƠN MỚI · ${order.orderNumber || order.id}`);
  lines.push(DIVIDER);
  lines.push(`📅 Đặt:    ${formatDateShort(orderDate)}`);
  if (deliveryDate) {
    const dt = formatDateShort(deliveryDate);
    const time = order.deliveryTime ? ` ${order.deliveryTime}` : '';
    lines.push(`🚚 Giao:   ${dt}${time} · ${deliveryTypeLabel(order.deliveryType)}`);
  } else {
    lines.push(`🚚 Giao:   — · ${deliveryTypeLabel(order.deliveryType)}`);
  }
  lines.push(`👤 KH:     ${order.customer?.name || '(không có)'}`);
  lines.push(`📞         ${order.customer?.phone || '(không có)'}`);
  if (order.deliveryType !== 'PICKUP' && order.customer?.address) {
    lines.push(`🏠         ${order.customer.address}`);
  }
  lines.push('');
  lines.push(`📋 Sản phẩm (${totalItems}):`);
  if (order.items && order.items.length > 0) {
    order.items.forEach((it: any) => {
      lines.push(`   • ${it.name} × ${it.quantity || 0}`);
    });
  } else {
    lines.push('   (không có)');
  }
  lines.push('');
  lines.push(`💰 Hàng:    ${formatVND(subtotal)}`);
  const surcharge = Number(order.surchargeAmount || 0);
  if (surcharge > 0) {
    lines.push(`✨ Phụ thu: ${formatVND(surcharge)} · ${surchargeTagLabel(order.surchargeTag)}`);
    const shares = allocateSurcharge(surcharge, order.items || []);
    (order.items || []).forEach((it: any, idx: number) => {
      lines.push(`   • ${it.name} +${formatVND(shares[idx] || 0)}`);
    });
  }
  lines.push(`🚚 Ship:    ${formatVND(shipping)}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`💵 TỔNG:    ${formatVND(total)}`);
  if (order.note) {
    lines.push('');
    lines.push(`💬 Ghi chú: ${order.note}`);
  }
  return lines.join('\n');
};

// ============== UPDATE ORDER ==============
export interface OrderUpdateEditorInfo {
  name?: string;
  uid?: string;
}

/** Block render items + totals của một snapshot order — dùng cho 2 cột cũ/mới */
const renderOrderSnapshot = (order: any, title: string): string[] => {
  const lines: string[] = [];
  lines.push(`═══ ${title} ═══`);
  const items = order.items || [];
  const totalItems = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
  const subtotal = items.reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0);
  const shipping = order.shippingCost || 0;
  const total = getOrderTotal(order);

  if (items.length === 0) {
    lines.push('📋 (không có sản phẩm)');
  } else {
    lines.push(`📋 SP (${totalItems}):`);
    items.forEach((it: any) => {
      lines.push(`   • ${it.name} × ${it.quantity || 0}`);
    });
  }
  lines.push(`💰 Hàng:  ${formatVND(subtotal)}`);
  const surcharge = Number(order.surchargeAmount || 0);
  if (surcharge > 0) lines.push(`✨ Phụ thu: ${formatVND(surcharge)} · ${surchargeTagLabel(order.surchargeTag)}`);
  if (shipping > 0) lines.push(`🚚 Ship:  ${formatVND(shipping)}`);
  lines.push(`💵 Tổng:  ${formatVND(total)}`);
  return lines;
};

export const formatOrderUpdateMessage = (
  order: any,
  changes: OrderFieldChange[],
  editor?: OrderUpdateEditorInfo,
  itemsDiff?: import('@/utils/order/itemsDiff').ItemChangeEntry[],
  prevOrder?: any,
): string => {
  const lines: string[] = [];
  if (order.isTest) lines.push('⚠️ ĐƠN HÀNG TEST');
  lines.push(`🟡 CẬP NHẬT · ${order.orderNumber || order.id}`);
  lines.push(DIVIDER);
  lines.push(`👤 KH:     ${order.customer?.name || order.customerName || '(không có)'}`);
  lines.push(`✏️ Sửa:    ${editor?.name || 'Unknown'}`);
  lines.push(`🕒         ${formatDateShort(new Date())}`);

  // Show full đơn cũ vs đơn mới (side-by-side) khi có prevOrder
  if (prevOrder) {
    lines.push('');
    renderOrderSnapshot(prevOrder, 'ĐƠN CŨ').forEach((l) => lines.push(l));
    lines.push('');
    renderOrderSnapshot(order, 'ĐƠN MỚI').forEach((l) => lines.push(l));
  }

  // Summary các thay đổi
  lines.push('');
  lines.push(`📝 Thay đổi (${changes.length}):`);
  changes.forEach((c) => {
    const label = c.label || c.field;
    if (c.field === 'items' && itemsDiff && itemsDiff.length > 0) {
      lines.push(`   • ${label} (${itemsDiff.length} thay đổi):`);
      formatItemsDiff(itemsDiff).forEach((d) => lines.push(`     ${d}`));
      return;
    }
    const oldV = c.oldValue == null || c.oldValue === '' ? '—' : String(c.oldValue);
    const newV = c.newValue == null || c.newValue === '' ? '—' : String(c.newValue);
    lines.push(`   • ${label}: ${oldV} → ${newV}`);
  });

  // Tổng mới (gọn) — chỉ show nếu KHÔNG có prevOrder snapshot (tránh duplicate)
  if (!prevOrder) {
    lines.push('');
    lines.push(`💵 Tổng mới: ${formatVND(getOrderTotal(order))}`);
  }
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
  lines.push(`👤 KH:     ${custName}${phone ? ' · ' + phone : ''}`);
  lines.push(`🗑️ Xoá:    ${editor?.name || 'Unknown'}`);
  lines.push(`🕒         ${formatDateShort(new Date())}`);
  lines.push(`💵 Giá trị: ${formatVND(getOrderTotal(order))}`);
  return lines.join('\n');
};

// ============== BATCH REMINDERS (giữ nguyên) ==============
export const formatUnpaidOrdersMessage = (orders: Order[]): string => {
  // Defensive: loại đơn đã huỷ / trả lại — không tính là chưa TT
  const filtered = orders.filter((o) => {
    const st = String(o.status ?? '').toUpperCase();
    return st !== 'CANCELLED' && st !== 'RETURNED';
  });
  if (filtered.length === 0) return `✅ Không có đơn hàng chưa thanh toán.`;
  const totalUnpaid = filtered.reduce((s, o) => s + getOrderTotal(o), 0);
  const lines: string[] = [];
  lines.push(`⚠️ ĐƠN CHƯA THANH TOÁN`);
  lines.push(DIVIDER);
  lines.push(`📊 Tổng số:  ${filtered.length} đơn`);
  lines.push(`💰 Tổng tiền: ${formatVND(totalUnpaid)}`);
  lines.push('');
  filtered.forEach((o, i) => {
    const od = parseDateValue(o.orderDate || o.date);
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))}`);
    lines.push(`   👤 ${o.customer?.name || '(không có)'} · ${o.customer?.phone || ''}`);
    lines.push(`   🕒 ${formatDateShort(od)}`);
  });
  return lines.join('\n');
};

export const formatPendingOrdersMessage = (orders: Order[]): string => {
  if (orders.length === 0) return `✅ Không có đơn hàng cần xử lý.`;
  const totalPending = orders.reduce((s, o) => s + getOrderTotal(o), 0);
  const lines: string[] = [];
  lines.push(`⚠️ ĐƠN CẦN XỬ LÝ`);
  lines.push(DIVIDER);
  lines.push(`📊 Tổng số:  ${orders.length} đơn`);
  lines.push(`💰 Tổng tiền: ${formatVND(totalPending)}`);
  lines.push('');
  orders.forEach((o, i) => {
    const od = parseDateValue(o.orderDate || o.date);
    const dd = o.deliveryDate ? parseDateValue(o.deliveryDate) : null;
    const totalItems = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))}`);
    lines.push(`   👤 ${o.customer?.name || '(không có)'} · ${o.customer?.phone || ''}`);
    lines.push(`   🕒 Đặt: ${formatDateShort(od)}`);
    if (dd) lines.push(`   📅 Giao: ${formatDateShort(dd)}${o.deliveryTime ? ' ' + o.deliveryTime : ''}`);
    lines.push(`   📦 ${totalItems} sp · ${o.status} · ${o.paymentStatus}`);
    if (o.items && o.items.length > 0) {
      o.items.forEach((it) => lines.push(`      • ${it.name} × ${it.quantity || 0}`));
    }
  });
  return lines.join('\n');
};

export const formatDeliveryDueMessage = (orders: Order[], targetDate?: Date): string => {
  const dateStr = targetDate ? formatDateShort(targetDate) : 'hôm nay';
  if (orders.length === 0) return `✅ Không có đơn hàng cần giao vào ${dateStr}.`;
  const lines: string[] = [];
  lines.push(`🚚 ĐƠN CẦN GIAO · ${dateStr}`);
  lines.push(DIVIDER);
  lines.push(`📊 Tổng số:  ${orders.length} đơn`);
  lines.push('');
  orders.forEach((o, i) => {
    const dd = o.deliveryDate ? parseDateValue(o.deliveryDate) : null;
    const totalItems = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))}`);
    lines.push(`   👤 ${o.customer?.name || '(không có)'} · ${o.customer?.phone || ''}`);
    if (o.customer?.address) lines.push(`   🏠 ${o.customer.address}`);
    if (dd) lines.push(`   📅 Giao: ${formatDateShort(dd)}${o.deliveryTime ? ' ' + o.deliveryTime : ''}`);
    lines.push(`   📦 ${totalItems} sp`);
    if (o.items && o.items.length > 0) {
      o.items.forEach((it) => lines.push(`      • ${it.name} × ${it.quantity || 0}`));
    }
  });
  return lines.join('\n');
};

export const formatPaymentReceivedMessage = (orderNumber: string | null, transactionAmount: number): string => {
  const lines: string[] = [];
  lines.push(`💰 ĐÃ NHẬN THANH TOÁN${orderNumber ? ' · ' + orderNumber : ''}`);
  lines.push(DIVIDER);
  lines.push(`💵 Số tiền: ${formatVND(transactionAmount)}`);
  lines.push(`✅ Trạng thái: ĐÃ THANH TOÁN`);
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
  lines.push(`⚠️ ĐƠN PENDING QUÁ ${thresholdHours}H`);
  lines.push(DIVIDER);
  lines.push(`📊 ${orders.length} đơn chưa xác nhận`);
  lines.push('');
  const now = Date.now();
  orders.forEach((o, i) => {
    const created = parseDateValue(o.orderDate || o.createdAt || (o as any).date);
    const ageH = created ? Math.floor((now - created.getTime()) / 3600000) : null;
    lines.push(`${i + 1}. ${o.orderNumber || o.id} · ${formatVND(getOrderTotal(o))}`);
    lines.push(`   👤 ${o.customer?.name || '(không có)'} · ${o.customer?.phone || ''}`);
    if (created) lines.push(`   ⏰ Tạo: ${formatDateShort(created)}${ageH != null ? ` (${ageH}h trước)` : ''}`);
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
  lines.push(`📦 Đơn:        ${orders.length}`);
  lines.push(`💵 Doanh thu:  ${formatVND(revenue)}`);
  if (stats.newCustomersCount !== undefined) {
    lines.push(`👥 KH mới:     ${stats.newCustomersCount}`);
  }
  lines.push('');
  lines.push(`💳 Thanh toán:`);
  lines.push(`   ✅ Đã TT:    ${paid} đơn`);
  lines.push(`   ⏳ Chưa TT:  ${unpaid} đơn`);
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
