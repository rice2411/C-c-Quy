import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  limit,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { DeliveryType, Order, OrderHistoryEntry, PaymentMethod, PaymentStatus } from "@/types";
import { UserRole } from "@/types/user";
import { diffOrders } from "@/utils/order/orderHistoryDiff";
import { resolveZaloGroupIdsForNewOrder } from "./configurationService";
import { sendNewOrderZaloNotifications } from "./zaloService";
import { getUserByUid } from "./userService";

/** Nem khi CTV co cap nhat don khong phai do ho tao */
export const ORDER_EDIT_DENIED = "ORDER_EDIT_DENIED";

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef);
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const creatorUid =
        typeof data.createdBy === "string" && data.createdBy.length > 0 ? data.createdBy : undefined;
      const user = creatorUid ? await getUserByUid(creatorUid) : null;
      return {
        ...data,
        id: docSnap.id,
        createdByUid: creatorUid,
        createdBy: user?.customName || user?.displayName || user?.email || creatorUid || "",
      } as Order;
    });
    return (await Promise.all(result)).sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
  } catch (error) {
    console.error("Error fetching orders from Firebase:", error);
    return [];
  }
};

export const getNextOrderNumber = async (): Promise<string> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderNumber", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0].data();
      const lastNumberStr = lastOrder.orderNumber;

      if (lastNumberStr && lastNumberStr.startsWith("ORD-")) {
        const numPart = parseInt(lastNumberStr.split("-")[1], 10);
        if (!isNaN(numPart)) {
          return `ORD-${String(numPart + 1).padStart(6, "0")}`;
        }
      }
    }

    return "ORD-000001";
  } catch (e) {
    console.warn(
      "Failed to generate order number from DB, falling back to basic.",
      e
    );
    return `ORD-${Date.now().toString().slice(-6)}`;
  }
};

export const addOrder = async (orderData: Order): Promise<void> => {
  try {
    const ordersRef = collection(db, "orders");

    const orderNumber = orderData.orderNumber || (await getNextOrderNumber());

    const payload = {
      orderNumber: orderNumber,
      sepayId: orderData.sepayId || null,
      customerName: orderData.customer?.name || "",
      phone: orderData.customer?.phone || "",
      address: orderData.customer?.address || "",
      email: orderData.customer?.email || "",
      customer: {
        id: orderData.customer?.id || "",
        name: orderData.customer?.name || "",
        phone: orderData.customer?.phone || "",
        address: orderData.customer?.address || "",
        email: orderData.customer?.email || "",
        city: orderData.customer?.city || "",
        country: orderData.customer?.country || "",
      },

      items: orderData.items || [],
      shippingCost: orderData.shippingCost || 0,
      total: orderData.total || 0,
      note: orderData.note || "",
      status: orderData.status,
      deliveryDate: orderData.deliveryDate || null,
      deliveryTime: orderData.deliveryTime || null,
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      paymentStatus: orderData.paymentStatus || PaymentStatus.UNPAID,
      paymentMethod: orderData.paymentMethod || PaymentMethod.CASH,
      isTest: !!orderData.isTest,
      deliveryType: orderData.deliveryType || DeliveryType.SHIP,
      createdBy: orderData.createdBy || undefined,
    };
    const zaloGroupIds = await resolveZaloGroupIdsForNewOrder(
      orderData.createdBy as string | undefined,
    );
    await addDoc(ordersRef, payload);
    await sendNewOrderZaloNotifications(payload as any, zaloGroupIds);
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export interface OrderUpdateEditor {
  uid: string;
  role: UserRole | undefined;
  displayName?: string;
  email?: string;
}

export const updateOrder = async (
  orderId: string,
  orderData: any,
  editor?: OrderUpdateEditor
): Promise<void> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const existingSnap = await getDoc(orderRef);
    if (!existingSnap.exists()) {
      throw new Error("ORDER_NOT_FOUND");
    }
    const existing = existingSnap.data();
    const creatorUid = existing.createdBy as string | undefined;

    if (editor?.role === UserRole.COLABORATOR) {
      if (!editor.uid || !creatorUid || creatorUid !== editor.uid) {
        throw new Error(ORDER_EDIT_DENIED);
      }
    }

    const safeCustomer = {
      id: orderData.customer?.id || "",
      name: orderData.customer?.name || "",
      phone: orderData.customer?.phone || "",
      address: orderData.customer?.address || "",
      email: orderData.customer?.email || "",
      city: orderData.customer?.city || "",
      country: orderData.customer?.country || "",
    };

    const payload: any = {
      customerName: safeCustomer.name,
      phone: safeCustomer.phone,
      address: safeCustomer.address,
      email: safeCustomer.email,
      customer: safeCustomer,
      items: orderData.items || [],
      shippingCost: orderData.shippingCost || 0,
      total: orderData.total || 0,
      note: orderData.note || "",
      status: orderData.status,
      ...(orderData.deliveryDate !== undefined && {
        deliveryDate: orderData.deliveryDate || null,
      }),
      ...(orderData.deliveryTime !== undefined && {
        deliveryTime: orderData.deliveryTime || null,
      }),
      paymentStatus: orderData.paymentStatus || PaymentStatus.UNPAID,
      paymentMethod: orderData.paymentMethod || PaymentMethod.CASH,
      ...(orderData.sepayId !== undefined && { sepayId: orderData.sepayId }),
      ...(orderData.isTest !== undefined && { isTest: !!orderData.isTest }),
      ...(orderData.deliveryType !== undefined && { deliveryType: orderData.deliveryType }),
      updatedAt: Timestamp.now(),
    };

    // Tinh diff giua existing va payload moi -> append history entry
    const changes = diffOrders(existing, {
      ...existing,
      ...payload,
      customer: safeCustomer,
    });
    if (changes.length > 0) {
      const uidShort = editor?.uid ? ("User-" + editor.uid.slice(0, 6)) : null;
      const editorName =
        editor?.displayName ||
        editor?.email ||
        uidShort ||
        "Unknown";
      // Build entry — KHÔNG để bất kỳ field nào là undefined (Firestore reject)
      const newEntry = {
        at: Timestamp.now(),
        by: editorName || "Unknown",
        byUid: editor?.uid || "",
        changes: changes.map((c: any) => ({
          field: c.field || "",
          label: c.label || "",
          oldValue: c.oldValue ?? "—",
          newValue: c.newValue ?? "—",
        })),
      };
      // Dùng arrayUnion để append ở server-side — tránh đọc-spread-ghi-lại gây fail
      // khi entry cũ trong array có field undefined.
      payload.history = arrayUnion(newEntry);
      payload.updatedBy = editorName || "Unknown";
    }

    await updateDoc(orderRef, payload);
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};


/**
 * Xóa đơn hàng trong Firebase
 * @param {string} orderId - Mã đơn hàng
 * @returns {Promise<void>} Không trả về
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    if (!orderId) throw new Error("Order ID is required");
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};
