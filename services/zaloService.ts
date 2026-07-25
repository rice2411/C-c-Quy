import { apiClient } from "@/services/api/client";
import { fetchPaymentAccounts } from "@/services/configurationService";
import { Order, OrderFieldChange } from "@/types";
import { generateQRCodeImage, getOrderTotal } from "@/utils/order/orderUtils";
import {
  DailySummaryStats,
  formatDailySummaryMessage,
  formatDeliveryDueMessage,
  formatHealthCheckMessage,
  formatOrderDeleteMessage,
  formatOrderMessage,
  formatOrderUpdateMessage,
  formatPendingOrdersMessage,
  formatProductionTomorrowMessage,
  formatStuckPendingMessage,
  formatUnpaidOrdersMessage,
  OrderUpdateEditorInfo,
} from "@/utils/zalo/zaloUtil";

// Lop GUI HTTP da chuyen sang BE (proxy /zalo/send) de giau ZALO_TOKEN khoi bundle FE.
// Moi logic build message van giu nguyen o FE; chi cac primitive duoi day goi BE.

const postTextToGroups = async (groupIds: string[], message: string) => {
  await apiClient.post('/zalo/send', { groupIds, message });
};

const postImageToGroups = async (
  groupIds: string[],
  body: { caption: string; image_url: string[]; message: string },
) => {
  await apiClient.post('/zalo/send', {
    groupIds,
    message: body.message,
    image: { caption: body.caption, image_url: body.image_url },
  });
};

export const sendZaloMessage = async (message: string) => {
  // Khong truyen groupIds → BE dung ZALO_MAIN_GROUP_ID tu env (giong logic cu).
  try {
    await apiClient.post('/zalo/send', { message });
  } catch (error: any) {
    console.error("Loi gui Zalo:", error.response?.data || error.message);
    throw error;
  }
};

export const sendNewOrderZaloNotifications = async (order: any, groupIds: string[]) => {
  if (groupIds.length === 0) return;
  const message = formatOrderMessage(order);

  const orderNumber = order?.orderNumber || order?.id;
  const amount = getOrderTotal(order);
  // Non-React: không dùng hook → fetch list TK trước, chọn TK active (find isActive,
  // fallback item đầu). Rỗng → không có QR → gửi text-only. des = "SEVQR <orderNumber>".
  const accounts = await fetchPaymentAccounts();
  const activeAccount = accounts.find((a) => a.isActive) ?? accounts[0] ?? null;
  const qrUrl =
    orderNumber && amount && activeAccount
      ? generateQRCodeImage(orderNumber, amount, activeAccount)
      : '';
  if (!qrUrl) {
    await postTextToGroups(groupIds, message);
    return;
  }
  try {
    await postImageToGroups(groupIds, {
      caption: `QR thanh toan don ${orderNumber}`,
      image_url: [qrUrl],
      message,
    });
  } catch (error: any) {
    console.error("Loi gui Zalo + QR:", error.response?.data || error.message);
    try { await postTextToGroups(groupIds, message); } catch {}
    throw error;
  }
};

export const sendOrderUpdateNotification = async (
  order: any,
  changes: OrderFieldChange[],
  editor: OrderUpdateEditorInfo | undefined,
  groupIds: string[],
  itemsDiff?: import('@/utils/order/itemsDiff').ItemChangeEntry[],
  prevOrder?: any,
) => {
  if (groupIds.length === 0 || changes.length === 0) return;
  const message = formatOrderUpdateMessage(order, changes, editor, itemsDiff, prevOrder);
  try {
    await postTextToGroups(groupIds, message);
  } catch (error: any) {
    console.error("Loi gui Zalo update:", error.response?.data || error.message);
  }
};

export const sendOrderDeleteNotification = async (
  order: any,
  editor: OrderUpdateEditorInfo | undefined,
  groupIds: string[],
) => {
  if (groupIds.length === 0) return;
  const message = formatOrderDeleteMessage(order, editor);
  try {
    await postTextToGroups(groupIds, message);
  } catch (error: any) {
    console.error("Loi gui Zalo delete:", error.response?.data || error.message);
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

export const sendDeliveryDueNotification = async (orders: Order[], fromDate?: Date, toDate?: Date) => {
  const message = formatDeliveryDueMessage(orders, fromDate, toDate);
  await sendZaloMessage(message);
};

export const sendCustomNotification = async (message: string) => {
  await sendZaloMessage(message);
};

/**
 * Gui 1 message test toi 1 group ID. Tra ve { ok, error? } thay vi throw.
 */
export const sendZaloTestMessage = async (
  groupId: string,
  customMessage?: string,
): Promise<{ ok: boolean; error?: string }> => {
  const cleanId = (groupId || '').trim();
  if (!cleanId) return { ok: false, error: 'Group ID trong' };
  const now = new Date();
  const message =
    customMessage ||
    `🔔 TEST THONG BAO\n━━━━━━━━━━━━━━━\nDay la tin nhan test tu he thong.\nNeu nhan duoc tin nay, group da cau hinh dung.\n\nThoi gian: ${now.toLocaleString('vi-VN')}`;
  try {
    await postTextToGroups([cleanId], message);
    return { ok: true };
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Loi khong xac dinh';
    return { ok: false, error: msg };
  }
};

// ============== SCHEDULED / OPS NOTIFICATIONS ==============

export const sendProductionTomorrowNotification = async (orders: Order[], targetDate: Date) => {
  const message = formatProductionTomorrowMessage(orders, targetDate);
  await sendZaloMessage(message);
};

export const sendStuckPendingNotification = async (orders: Order[], thresholdHours: number) => {
  const message = formatStuckPendingMessage(orders, thresholdHours);
  await sendZaloMessage(message);
};

export const sendDailySummaryNotification = async (stats: DailySummaryStats, date: Date) => {
  const message = formatDailySummaryMessage(stats, date);
  await sendZaloMessage(message);
};

export const sendHealthCheckNotification = async () => {
  const message = formatHealthCheckMessage(new Date());
  await sendZaloMessage(message);
};
