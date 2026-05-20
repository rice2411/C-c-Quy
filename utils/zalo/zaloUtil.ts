import { Order } from "@/types";
import { parseDateValue } from "../format/dateUtil";
import { formatVND } from "../format/currencyUtil";
import { getOrderTotal } from "../order/orderUtils";

export const formatDate = (date: Date | null): string => {
  if (!date) return '(không có)';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};


export const formatOrderMessage = (order: any): string => {
  const orderDate = parseDateValue(order.orderDate || order.date);
  const deliveryDate = order.deliveryDate ? parseDateValue(order.deliveryDate) : null;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const totalItems = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

  let message = ``;
  if (order.isTest) {
    message += `=== ĐƠN HÀNG TEST ===\n`;
  }
  message += `
📦 == ĐƠN HÀNG MỚI ${currentMonth}/${currentYear} == \n
🆔 Mã đơn: ${order.orderNumber || order.id}
🕒 Ngày đặt: ${formatDate(orderDate)}`;

  if (deliveryDate) {
    message += `\n📅 Ngày giao: ${formatDate(deliveryDate)}`;
    if (order.deliveryTime) {
      message += ` ${order.deliveryTime}`;
    }
  }

  // Hình thức nhận hàng — PICKUP / SHIP
  const deliveryTypeLabel =
    order.deliveryType === 'PICKUP' ? '🏬 Khách qua lấy' : '🚚 Ship đến địa chỉ';
  message += `\n${deliveryTypeLabel}`;

  message += `\n👤 Khách hàng: ${order.customer?.name || '(không có)'}
📞 SĐT: ${order.customer?.phone || '(không có)'}
🏠 Địa chỉ: ${order.customer?.address || '(không có)'}

💰 Phí ship: ${formatVND(order.shippingCost || 0)}
💬 Ghi chú: ${order.note || '(không có)'}

📦 Số lượng sản phẩm: ${totalItems} ${totalItems === 1 ? 'sản phẩm' : 'sản phẩm'}\n`;

  if (order.items && order.items.length > 0) {
    message += `📋 Chi tiết sản phẩm:\n`;
    order.items.forEach((item: any, itemIndex: number) => {
      message += `   ${itemIndex + 1}. ${item.name} x${item.quantity || 0}\n`;
    });
    message += `\n`;
  }

  message += `💰 Tổng tiền: ${formatVND(getOrderTotal(order))}
`;

  return message;
};

export const formatUnpaidOrdersMessage = (orders: Order[]): string => {
  if (orders.length === 0) {
    return `✅ Không có đơn hàng chưa thanh toán.`;
  }

  const totalUnpaid = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  let message = `⚠️ == THÔNG BÁO ĐƠN HÀNG CHƯA THANH TOÁN ==\n\n`;
  message += `📊 Tổng số đơn: ${orders.length}\n`;
  message += `💰 Tổng tiền: ${formatVND(totalUnpaid)}\n\n`;
  message += `📋 Danh sách đơn hàng:\n`;

  orders.forEach((order, index) => {
    const orderDate = parseDateValue(order.orderDate || order.date);
    message += `\n${index + 1}. 🆔 ${order.orderNumber || order.id}\n`;
    message += `   👤 ${order.customer?.name || '(không có)'}\n`;
    message += `   📞 ${order.customer?.phone || '(không có)'}\n`;
    message += `   🕒 ${formatDate(orderDate)}\n`;
    message += `   💰 ${formatVND(getOrderTotal(order))}\n`;
  });

  return message;
};

export const formatPendingOrdersMessage = (orders: Order[]): string => {
  if (orders.length === 0) {
    return `✅ Không có đơn hàng cần xử lý.`;
  }

  const totalPending = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  let message = `⚠️ == THÔNG BÁO ĐƠN HÀNG CẦN XỬ LÝ ==\n\n`;
  message += `📊 Tổng số đơn: ${orders.length}\n`;
  message += `💰 Tổng tiền: ${formatVND(totalPending)}\n\n`;
  message += `📋 Danh sách đơn hàng:\n`;

  orders.forEach((order, index) => {
    const orderDate = parseDateValue(order.orderDate || order.date);
    const deliveryDate = order.deliveryDate ? parseDateValue(order.deliveryDate) : null;
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    message += `\n${index + 1}. 🆔 ${order.orderNumber || order.id}\n`;
    message += `   👤 ${order.customer?.name || '(không có)'}\n`;
    message += `   📞 ${order.customer?.phone || '(không có)'}\n`;
    message += `   🕒 Đặt: ${formatDate(orderDate)}\n`;
    if (deliveryDate) {
      message += `   📅 Giao: ${formatDate(deliveryDate)}`;
      if (order.deliveryTime) {
        message += ` ${order.deliveryTime}`;
      }
      message += `\n`;
    }
    message += `   📦 Số lượng sản phẩm: ${totalItems} ${totalItems === 1 ? 'sản phẩm' : 'sản phẩm'}\n`;
    message += `   📦 Trạng thái: ${order.status}\n`;
    message += `   💳 Thanh toán: ${order.paymentStatus}\n`;
    message += `   💰 ${formatVND(getOrderTotal(order))}\n`;
  });

  return message;
};

export const formatDeliveryDueMessage = (orders: Order[], targetDate?: Date): string => {
  if (orders.length === 0) {
    const dateStr = targetDate ? formatDate(targetDate) : 'hôm nay';
    return `✅ Không có đơn hàng cần giao vào ${dateStr}.`;
  }

  const dateStr = targetDate ? formatDate(targetDate) : 'hôm nay';
  let message = `🚚 == THÔNG BÁO ĐƠN HÀNG CẦN GIAO ==\n\n`;
  message += `📅 Ngày giao: ${dateStr}\n`;
  message += `📊 Tổng số đơn: ${orders.length}\n\n`;
  message += `📋 Danh sách đơn hàng:\n`;

  orders.forEach((order, index) => {
    const orderDate = parseDateValue(order.orderDate || order.date);
    const deliveryDate = order.deliveryDate ? parseDateValue(order.deliveryDate) : null;
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    message += `\n${index + 1}. 🆔 ${order.orderNumber || order.id}\n`;
    message += `   👤 ${order.customer?.name || '(không có)'}\n`;
    message += `   📞 ${order.customer?.phone || '(không có)'}\n`;
    message += `   🏠 ${order.customer?.address || '(không có)'}\n`;
    message += `   🕒 Đặt: ${formatDate(orderDate)}\n`;
    if (deliveryDate) {
      message += `   📅 Giao: ${formatDate(deliveryDate)}`;
      if (order.deliveryTime) {
        message += ` ${order.deliveryTime}`;
      }
      message += `\n`;
    }
    message += `   📦 Số lượng sản phẩm: ${totalItems} ${totalItems === 1 ? 'sản phẩm' : 'sản phẩm'}\n`;
    
    if (order.items && order.items.length > 0) {
      message += `   📋 Chi tiết sản phẩm:\n`;
      order.items.forEach((item, itemIndex) => {
        message += `      ${itemIndex + 1}. ${item.name} x${item.quantity || 0}\n`;
      });
    }
    
    message += `   💰 ${formatVND(getOrderTotal(order))}\n`;
  });

  return message;
};

export const formatPaymentReceivedMessage = (orderNumber: string | null, transactionAmount: number): string => {
  let message = `💰 == THÔNG BÁO ĐÃ NHẬN THANH TOÁN ==\n\n`;
  
  if (orderNumber) {
    message += `🆔 Mã đơn: ${orderNumber}\n`;
  }
  
  message += `💰 Số tiền đã thanh toán: ${formatVND(transactionAmount)}\n`;
  message += `✅ Trạng thái: ĐÃ THANH TOÁN\n`;

  return message;
};
