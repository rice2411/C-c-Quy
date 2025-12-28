import axios from "axios";
import { Order } from "@/types";
import {
  formatOrderMessage,
  formatUnpaidOrdersMessage,
  formatPendingOrdersMessage,
  formatDeliveryDueMessage
} from "@/utils/zaloUtil";

export const sendZaloMessage = async (message: string) => {
  const url = process.env.ZALO_URL;
  const shopCode = process.env.ZALO_SHOP_CODE;
  const token = process.env.ZALO_TOKEN;

  if (!url || !shopCode || !token) {
    throw new Error('Zalo configuration is missing');
  }

  try {
    await axios.post(`${url}/${shopCode}/${token}`, {
      send_from_number: "84776750418",
      send_to_groupid: "165291943369399492",
      message: message,
    });
  } catch (error: any) {
    console.error("Lỗi khi gửi tin nhắn:", error.response?.data || error.message);
    throw error;
  }
};

export const sendMessageToGroup = async (order: any) => {
  const message = formatOrderMessage(order);
  await sendZaloMessage(message);
};

export const sendUnpaidOrdersNotification = async (orders: Order[]) => {
  const message = formatUnpaidOrdersMessage(orders);
  await sendZaloMessage(message);
};

export const sendPendingOrdersNotification = async (orders: Order[]) => {
  const message = formatPendingOrdersMessage(orders);
  await sendZaloMessage(message);
};

export const sendDeliveryDueNotification = async (orders: Order[], targetDate?: Date) => {
  const message = formatDeliveryDueMessage(orders, targetDate);
  await sendZaloMessage(message);
};

export const sendCustomNotification = async (message: string) => {
  await sendZaloMessage(message);
};
