import axios from "axios";
import { Order } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { generateQRCodeImage, getOrderTotal } from "@/utils/orderUtils";
import {
  formatDeliveryDueMessage,
  formatOrderMessage,
  formatPendingOrdersMessage,
  formatUnpaidOrdersMessage,
} from "@/utils/zaloUtil";

const ZALO_ENDPOINT = {
  sendImageToGroup: "https://new.abitstore.vn/zalo/sendImageToGroupZalo/2",
  sendMessToGroup: "https://new.abitstore.vn/zalo/sendMessageToGroupZalo/2",
};
const ZALO_SENDER_NUMBER = "84776750418";

const postTextToGroups = async (groupIds: string[], message: string) => {
  const url = ZALO_ENDPOINT.sendMessToGroup;
  const shopCode = process.env.ZALO_SHOP_CODE;
  const token = process.env.ZALO_TOKEN;

  if (!url || !shopCode || !token) {
    throw new Error("Zalo configuration is missing");
  }

  await Promise.all(
    groupIds.map((groupId) =>
      axios.post(`${url}/${shopCode}/${token}`, {
        send_from_number: ZALO_SENDER_NUMBER,
        send_to_groupid: groupId,
        message,
      }),
    ),
  );
};

const postImageToGroups = async (
  groupIds: string[],
  body: {
    caption: string;
    image_url: string[];
    message: string;
  },
) => {
  const url = ZALO_ENDPOINT.sendImageToGroup;
  const shopCode = process.env.ZALO_SHOP_CODE;
  const token = process.env.ZALO_TOKEN;
  if (!url || !shopCode || !token) {
    throw new Error("Zalo configuration is missing");
  }

  await Promise.all(
    groupIds.map((groupId) =>
      axios.post(`${url}/${shopCode}/${token}`, {
        ...body,
        send_from_number: ZALO_SENDER_NUMBER,
        send_to_groupid: groupId,
      }),
    ),
  );
};


/** Broadcast-style messages: main group from env (with legacy fallback). */
export const sendZaloMessage = async (message: string) => {
  const fromEnv = String(process.env.ZALO_MAIN_GROUP_ID ?? '').trim();
  const mainIds = [fromEnv];
  try {
    await postTextToGroups(mainIds, message);
  } catch (error: any) {
    console.error(
      "Lỗi khi gửi tin nhắn:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/** New order: send to explicit group ids (from order routing). */
export const sendNewOrderZaloNotifications = async (
  order: any,
  groupIds: string[],
) => {
  if (groupIds.length === 0) return;

  const message = formatOrderMessage(order);
  const isBankingOrder = order?.paymentMethod === PaymentMethod.BANKING;

  if (!isBankingOrder) {
    await postTextToGroups(groupIds, message);
    return;
  }

  const shopCode = process.env.ZALO_SHOP_CODE;
  const token = process.env.ZALO_TOKEN;
  if (!shopCode || !token) {
    throw new Error("Zalo configuration is missing");
  }

  const orderNumber = order?.orderNumber || order?.id;
  const amount = getOrderTotal(order);
  const qrUrl = generateQRCodeImage(orderNumber, amount);
  if (!orderNumber || !amount || !qrUrl) {
    await postTextToGroups(groupIds, message);
    return;
  }

  try {
    await postImageToGroups(groupIds, {
      caption: `QR thanh toán đơn ${orderNumber}`,
      image_url: [qrUrl],
      message,
    });
  } catch (error: any) {
    console.error(
      "Lỗi khi gửi tin nhắn kèm QR đơn hàng:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const sendUnpaidOrdersNotification = async (orders: Order[]) => {
  const message = formatUnpaidOrdersMessage(orders);
  await sendZaloMessage(message);
};

export const sendPendingOrdersNotification = async (orders: Order[]) => {
  const message = formatPendingOrdersMessage(orders);
  await sendZaloMessage(message);
};

export const sendDeliveryDueNotification = async (
  orders: Order[],
  targetDate?: Date,
) => {
  const message = formatDeliveryDueMessage(orders, targetDate);
  await sendZaloMessage(message);
};

export const sendCustomNotification = async (message: string) => {
  await sendZaloMessage(message);
};
