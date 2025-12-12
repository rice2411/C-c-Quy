import axios from "axios";

export const sendMessageToGroup = async (order: any) => {
  const url = process.env.ZALO_URL;
  const shopCode = process.env.ZALO_SHOP_CODE;
  const token = process.env.ZALO_TOKEN;

  // Format ngày giờ
  const orderDate = new Date(order.orderDate.toDate()).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });


  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Tạo message hoàn chỉnh
  const message = `
📦 == ĐƠN HÀNG MỚI ${currentMonth}/${currentYear} == \n
🆔 Mã đơn: ${order.orderNumber}
🕒 Ngày đặt: ${orderDate}
👤 Khách hàng: ${order.customer.name || '(không có)'}
📞 SĐT: ${order.customer.phone || '(không có)'}
🏠 Địa chỉ: ${order.customer.address || '(không có)'}

💵 Phương thức thanh toán: ${order.paymentMethod}
💰 Phí ship: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingCost || 0)}
💬 Ghi chú: ${order.notes || '(không có)'}

💰 Tổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
💳 Trạng thái thanh toán: ${order.paymentStatus}
📦 Trạng thái đơn hàng: ${order.status}

`;

  try {
    const response = await axios.post(`${url}/${shopCode}/${token}`, {
      send_from_number: "84776750418",
      send_to_groupid: "165291943369399492",
      message: message,
    });
    console.log("Gửi tin nhắn thành công:", response.data);
  } catch (error: any) {
    console.error("Lỗi khi gửi tin nhắn:", error.response?.data || error.message);
  }
};
