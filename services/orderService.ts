import { Order } from "@/types";
import { UserRole } from "@/types/user";
import { apiClient } from "@/services/api/client";
import { resolveZaloGroupIdsForOrderEvent } from "./configurationService";
import {
  sendNewOrderCardImage,
  sendNewOrderZaloNotifications,
  sendOrderDeleteNotification,
  sendOrderUpdateCardImage,
  sendOrderUpdateNotification,
} from "./zaloService";

/** Nem khi CTV co cap nhat don khong phai do ho tao (FE van can de so message). */
export const ORDER_EDIT_DENIED = "ORDER_EDIT_DENIED";

/**
 * Gui noti Zalo dang ANH the don, retry toi 4 lan (backoff) cho loi tam thoi
 * (mang / html-to-image miss anh lan dau). Can retry ma van loi (vd CORS anh SP —
 * deterministic) → fallback gui TEXT nhu cu de khong mat thong bao.
 */
const notifyOrderWithImageRetry = async (
  sendImage: () => Promise<void>,
  fallbackText: () => Promise<void>,
): Promise<void> => {
  for (let i = 0; i < 4; i++) {
    try {
      await sendImage();
      return;
    } catch (err) {
      console.error(`Zalo order-card image attempt ${i + 1} failed:`, err);
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  try {
    await fallbackText();
  } catch (err) {
    console.error("Zalo order-card fallback text failed (ignored):", err);
  }
};

/**
 * Lay danh sach don hang. Phan ghi/doc Firestore da chuyen sang BE
 * (GET /orders) — BE da enrich createdBy = ten hien thi va sort theo orderNumber.
 */
export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const res = await apiClient.get("/orders");
    return (res.data as Order[]) ?? [];
  } catch (error) {
    console.error("Error fetching orders from API:", error);
    return [];
  }
};

/** Sinh so don ke tiep (BE: GET /orders/next-number → { orderNumber }). */
export const getNextOrderNumber = async (): Promise<string> => {
  try {
    const res = await apiClient.get("/orders/next-number");
    const num = (res.data as { orderNumber?: string } | undefined)?.orderNumber;
    if (typeof num === "string" && num.length > 0) return num;
    return "ORD-000001";
  } catch (e) {
    console.warn("Failed to get order number from API, falling back.", e);
    return `ORD-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Tao don. BE ghi Firestore (sinh orderNumber neu thieu) va tra ve order da tao.
 * SAU KHI BE thanh cong → gui thong bao Zalo (goi API ngoai, GIU NGUYEN tren FE).
 * Loi Zalo duoc nuot de khong lam fail viec tao don.
 */
export const addOrder = async (orderData: Order): Promise<void> => {
  let created: any;
  try {
    const res = await apiClient.post("/orders", orderData);
    created = res.data;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }

  // ── Phan Zalo: chay sau khi tao don thanh cong ──
  try {
    const createdByUid =
      (orderData.createdBy as string | undefined) ??
      (created?.createdBy as string | undefined);
    const zaloGroupIds = await resolveZaloGroupIdsForOrderEvent(
      "create",
      createdByUid,
    );
    await notifyOrderWithImageRetry(
      () => sendNewOrderCardImage(created, zaloGroupIds),
      () => sendNewOrderZaloNotifications(created, zaloGroupIds),
    );
  } catch (notifErr) {
    console.error("New order Zalo notify error (ignored):", notifErr);
  }
};

export interface OrderUpdateEditor {
  uid: string;
  role: UserRole | undefined;
  displayName?: string;
  email?: string;
}

/**
 * Cap nhat don. BE check quyen (CTV chi sua don cua minh) + tinh diff + ghi history,
 * tra ve order sau cap nhat (kem `changes` de FE biet co gi doi → gui Zalo).
 * Neu BE tra 403 → throw error message ORDER_EDIT_DENIED (UI hien thi nhu cu).
 */
export const updateOrder = async (
  orderId: string,
  orderData: any,
  editor?: OrderUpdateEditor
): Promise<void> => {
  let updated: any;
  try {
    const res = await apiClient.patch(`/orders/${orderId}`, orderData);
    updated = res.data;
  } catch (error: any) {
    const msg = String(error?.message ?? "");
    if (msg.includes(ORDER_EDIT_DENIED)) {
      throw new Error(ORDER_EDIT_DENIED);
    }
    console.error("Error updating order:", error);
    throw error;
  }

  // ── Phan Zalo update: chay sau khi BE cap nhat thanh cong ──
  const changes: any[] = Array.isArray(updated?.changes) ? updated.changes : [];
  const prevOrder = updated?.prevOrder;
  if (changes.length > 0) {
    try {
      const uidShort = editor?.uid ? "User-" + editor.uid.slice(0, 6) : null;
      const editorName =
        editor?.displayName || editor?.email || uidShort || "Unknown";
      const changedFieldIds = changes.map((c: any) => c.field).filter(Boolean);
      const zaloGroupIds = await resolveZaloGroupIdsForOrderEvent(
        "update",
        (prevOrder?.createdBy as string | undefined) ??
          (updated?.createdByUid as string | undefined) ??
          editor?.uid,
        changedFieldIds,
      );
      const orderForMsg = { ...updated, id: orderId };
      const { diffOrderItems } = await import("@/utils/order/itemsDiff");
      const itemsDiff = diffOrderItems(
        prevOrder?.items as any,
        updated?.items as any,
      );
      await notifyOrderWithImageRetry(
        () =>
          sendOrderUpdateCardImage(
            orderForMsg,
            changes,
            { name: editorName, uid: editor?.uid },
            zaloGroupIds,
          ),
        () =>
          sendOrderUpdateNotification(
            orderForMsg,
            changes,
            { name: editorName, uid: editor?.uid },
            zaloGroupIds,
            itemsDiff,
            prevOrder, // prevOrder de hien thi snapshot "DON CU" (fallback text)
          ),
      );
    } catch (notifErr) {
      console.error("Update Zalo notify error (ignored):", notifErr);
    }
  }
};

/* ───────────────── Đối soát phiếu hoàn ↔ giao dịch SePay (#186) ───────────────── */

/**
 * Gắn 1 giao dịch SePay tiền ra cho 1 phiếu hoàn.
 * BE trả về Order ĐẦY ĐỦ (đã refresh refunds) → caller set lại state đơn.
 * Lỗi (message=code): 404 REFUND_NOT_FOUND/TRANSACTION_NOT_FOUND,
 * 409 TRANSACTION_ALREADY_LINKED, 400 TRANSACTION_NOT_OUTGOING.
 */
export const reconcileRefund = async (
  orderId: string,
  refundId: string,
  transactionId: string,
): Promise<Order> => {
  const res = await apiClient.post(
    `/orders/${orderId}/refunds/${refundId}/reconcile`,
    { transactionId },
  );
  return res.data as Order;
};

/** 1 phiếu hoàn (mọi đơn) kèm ngữ cảnh đơn — đối soát từ phía GD tiền ra. */
export interface RefundListItem {
  refundId: string;
  orderId: string;
  orderNumber?: string | null;
  amount: number;
  reason?: string | null;
  createdAt?: unknown; // revive Timestamp
  transactionId?: string | null;
  reconciled: boolean;
  reconcileMethod?: 'sepay' | 'cash' | null;
}

/** Toàn bộ phiếu hoàn (mọi đơn) — GET /orders/refunds. Phục vụ đối soát tiền ra. */
export const fetchAllRefunds = async (): Promise<RefundListItem[]> => {
  const res = await apiClient.get('/orders/refunds');
  return (res.data as RefundListItem[]) ?? [];
};

/** Đánh dấu phiếu hoàn đã trả bằng tiền mặt. BE trả Order đầy đủ. */
export const markRefundCash = async (
  orderId: string,
  refundId: string,
): Promise<Order> => {
  const res = await apiClient.post(`/orders/${orderId}/refunds/${refundId}/cash`);
  return res.data as Order;
};

/** Gỡ đối soát phiếu hoàn (về trạng thái chưa đối soát). BE trả Order đầy đủ. */
export const unreconcileRefund = async (
  orderId: string,
  refundId: string,
): Promise<Order> => {
  const res = await apiClient.post(
    `/orders/${orderId}/refunds/${refundId}/unreconcile`,
  );
  return res.data as Order;
};

/**
 * Xoa don hang. BE xoa Firestore (DELETE /orders/:id). SAU DO gui Zalo notify
 * (GIU NGUYEN tren FE). Loi Zalo duoc nuot.
 */
export const deleteOrder = async (
  orderId: string,
  editor?: OrderUpdateEditor,
): Promise<void> => {
  if (!orderId) throw new Error("Order ID is required");
  let deleted: any;
  try {
    const res = await apiClient.delete(`/orders/${orderId}`);
    deleted = res.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }

  // ── Phan Zalo delete: dung snapshot prevOrder BE tra ve ──
  const existing = deleted?.prevOrder;
  if (existing) {
    try {
      const uidShort = editor?.uid ? "User-" + editor.uid.slice(0, 6) : null;
      const editorName =
        editor?.displayName || editor?.email || uidShort || "Unknown";
      const zaloGroupIds = await resolveZaloGroupIdsForOrderEvent(
        "delete",
        (existing.createdBy as string | undefined) ?? editor?.uid,
      );
      await sendOrderDeleteNotification(
        { ...existing, id: orderId },
        { name: editorName, uid: editor?.uid },
        zaloGroupIds,
      );
    } catch (notifErr) {
      console.error("Delete Zalo notify error (ignored):", notifErr);
    }
  }
};
