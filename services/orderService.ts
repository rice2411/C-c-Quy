import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Order, PaymentMethod, PaymentStatus } from "@/types"; 
import { sendMessageToGroup } from "./zaloService";
import { getUserByUid } from "./userService";

/**
 * Lấy toàn bộ đơn hàng từ Firebase
 * @returns {Promise<Order[]>} Array of orders
 */
export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef);
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const user = await getUserByUid(data.createdBy as string);
      return {
        ...data,
        id: doc.id,
        createdBy: user?.customName || user?.displayName || user?.email || data.createdBy as string,
      } as Order;
    });
    return (await Promise.all(result)).sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
  } catch (error) {
    console.error("Error fetching orders from Firebase:", error);
    return [];
  }
};

/**
 * Lấy mã đơn hàng tiếp theo
 * @returns {Promise<string>} Mã đơn hàng tiếp theo
 */
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

/**
 * Thêm đơn hàng mới vào Firebase
 * @param {Order} orderData - Thông tin đơn hàng
 * @returns {Promise<void>} Không trả về
 */
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
      status: orderData.status ,
      deliveryDate: orderData.deliveryDate || null,
      deliveryTime: orderData.deliveryTime || null,
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      paymentStatus: orderData.paymentStatus || PaymentStatus.UNPAID,
      paymentMethod: orderData.paymentMethod || PaymentMethod.CASH,
      createdBy: orderData.createdBy || undefined,
    };
    await addDoc(ordersRef, payload);
    await sendMessageToGroup(payload as any);
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

/**
 * Cập nhật đơn hàng trong Firebase
 * @param {string} orderId - Mã đơn hàng
 * @param {Order} orderData - Thông tin đơn hàng
 * @returns {Promise<void>} Không trả về
 */
export const updateOrder = async (
  orderId: string,
  orderData: any
): Promise<void> => {
  try {
    const orderRef = doc(db, "orders", orderId);

    // Clean customer data to ensure no undefined values
    const safeCustomer = {
      id: orderData.customer?.id || "",
      name: orderData.customer?.name || "",
      phone: orderData.customer?.phone || "",
      address: orderData.customer?.address || "",
      email: orderData.customer?.email || "",
      city: orderData.customer?.city || "",
      country: orderData.customer?.country || "",
    };

    const payload = {
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
       updatedAt: Timestamp.now(),
    };
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
