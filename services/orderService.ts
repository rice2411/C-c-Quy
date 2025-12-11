import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, ProductType, OrderItem, Customer } from '../types/index';
import { DEFAULT_PRICES } from '../constants/index';

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    // Try to order by orderDate if index exists, otherwise basic query
    const q = query(ordersRef); 
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Helper to safely convert Firestore timestamps or strings to ISO string
      const getDate = (val: any) => {
        if (!val) return new Date().toISOString();
        if (val.toDate && typeof val.toDate === 'function') {
          return val.toDate().toISOString();
        }
        return new Date(val).toISOString();
      };

      // Helper to map Firestore status string to Enum
      const mapStatus = (status: string): OrderStatus => {
        const s = (status || '').toLowerCase();
        if (s === 'completed' || s === 'success') return OrderStatus.DELIVERED;
        if (s === 'shipping' || s === 'shipped') return OrderStatus.SHIPPED;
        if (s === 'pending') return OrderStatus.PENDING;
        if (s === 'cancelled' || s === 'fail') return OrderStatus.CANCELLED;
        if (s === 'returned') return OrderStatus.RETURNED;
        if (s === 'processing') return OrderStatus.PROCESSING;
        
        // Fallback checks against Enum values directly
        const enumValues = Object.values(OrderStatus).map(v => v.toLowerCase());
        if (enumValues.includes(s as any)) {
            // Find the matching key/value
            const match = Object.values(OrderStatus).find(v => v.toLowerCase() === s);
            if (match) return match;
        }

        return OrderStatus.PROCESSING; // Default fallback
      };

      // Helper for Payment Status normalization
      const getPaymentStatus = (val: any): PaymentStatus => {
         if (!val) return PaymentStatus.UNPAID;
         const s = String(val).toLowerCase();
         if (s === 'paid') return PaymentStatus.PAID;
         if (s === 'refunded') return PaymentStatus.REFUNDED;
         return PaymentStatus.UNPAID;
      };

      // Helper for Payment Method normalization
      const getPaymentMethod = (val: any): PaymentMethod => {
         const s = String(val || '').toLowerCase();
         if (s === 'banking' || s === 'transfer' || s === 'chuyển khoản') return PaymentMethod.BANKING;
         return PaymentMethod.CASH;
      };

      // Helper to generate a consistent image based on product type
      const getProductImage = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('family') || t.includes('gia đình')) return 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=200';
        if (t.includes('friend') || t.includes('tình bạn')) return 'https://images.unsplash.com/photo-1621236378699-8597f840b45a?auto=format&fit=crop&q=80&w=200';
        if (t.includes('set') || t.includes('quà') || t.includes('gif')) return 'https://images.unsplash.com/photo-1549488352-22668e9e6c1c?auto=format&fit=crop&q=80&w=200';
        if (t.includes('cookie') || t.includes('bánh')) return 'https://images.unsplash.com/photo-1499636138143-bd649025ebeb?auto=format&fit=crop&q=80&w=200';
        if (t.includes('cake') || t.includes('kem')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200';
        return `https://placehold.co/200x200?text=${encodeURIComponent(type || 'Product')}`;
      };

      const typeLower = (data.type || '').toLowerCase();

      // Synthetic Item creation from flat fields
      const quantity = typeof data.quantity === 'number' ? data.quantity : 1;
      const shippingCost = typeof data.shippingCost === 'number' ? data.shippingCost : 0;
      
      // Attempt to deduce unit price if not present
      let price = data.price;
      
      // Fix/Default price logic for Sets
      if (!price || Number(price) === 0) {
          if (typeLower.includes('family')) price = DEFAULT_PRICES[ProductType.FAMILY];
          else if (typeLower.includes('friend')) price = DEFAULT_PRICES[ProductType.FRIENDSHIP];
          else {
             // Fallback for custom/other: try to deduce from total if available
             const tempTotal = typeof data.total === 'number' ? data.total : 0;
             price = quantity > 0 ? (tempTotal - shippingCost) / quantity : 0;
          }
      }

      // Use stored items if available, otherwise construct from legacy flat fields
      let items: OrderItem[] = [];
      if (data.items && Array.isArray(data.items)) {
         // Map existing items ensuring ID and Image exist
         items = data.items.map((item: any, idx: number) => ({
             id: item.id || `ITEM-${doc.id}-${idx}`,
             productName: item.productName || 'Unknown Product',
             quantity: Number(item.quantity) || 1,
             price: Number(item.price) || 0,
             image: item.image || getProductImage(item.productName)
         }));
      } else {
         items = [{
            id: `ITEM-${doc.id}`,
            productName: data.type ? (data.type.charAt(0).toUpperCase() + data.type.slice(1)) : 'Assorted Items',
            quantity: quantity,
            price: Number(price), 
            image: getProductImage(data.type)
          }];
      }

      // CONSISTENCY CHECK: Recalculate total using standard formula: Price * Quantity + Shipping
      const calculatedSubtotal = items.reduce((sum: number, item: OrderItem) => {
          return sum + (Number(item.price) * Number(item.quantity));
      }, 0);

      const finalTotal = calculatedSubtotal + Number(shippingCost);

      // Customer Construction: Prefer 'customer' object, fallback to flat fields
      let customer: Customer = data.customer ? { ...data.customer } : {
        id: '',
        name: data.customerName || 'Walk-in Customer',
        phone: data.phone || '',
        address: data.address || '',
        city: '',
        country: '',
        email: data.email || ''
      };

      // Ensure ID exists
      if (!customer.id) {
         customer.id = `CUST-${doc.id.substring(0, 6)}`;
      }

      return {
        id: doc.id,
        orderNumber: data.orderNumber,
        sepayId: data.sepayId, 
        customer: customer,
        items: items,
        total: finalTotal, // Use calculated total
        shippingCost: shippingCost,
        status: mapStatus(data.status),
        paymentStatus: getPaymentStatus(data.paymentStatus),
        paymentMethod: getPaymentMethod(data.paymentMethod),
        date: getDate(data.orderDate || data.createdAt),
        trackingNumber: data.trackingNumber,
        notes: data.note || data.notes || ''
      } as Order;
    });
  } catch (error) {
    console.error("Error fetching orders from Firebase:", error);
    return [];
  }
};

// Helper to find the next order number (ORD-XXXXXX)
export const getNextOrderNumber = async (): Promise<string> => {
  try {
    const ordersRef = collection(db, 'orders');
    // Sort by orderNumber string desc to get the highest one.
    const q = query(ordersRef, orderBy('orderNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0].data();
      const lastNumberStr = lastOrder.orderNumber;
      
      if (lastNumberStr && lastNumberStr.startsWith('ORD-')) {
        const numPart = parseInt(lastNumberStr.split('-')[1], 10);
        if (!isNaN(numPart)) {
           return `ORD-${String(numPart + 1).padStart(6, '0')}`;
        }
      }
    }
    
    // Default start
    return 'ORD-000001';
  } catch (e) {
    console.warn("Failed to generate order number from DB, falling back to basic.", e);
    return `ORD-${Date.now().toString().slice(-6)}`;
  }
};

export const addOrder = async (orderData: any): Promise<void> => {
  try {
    const ordersRef = collection(db, 'orders');
    
    // Use provided order number or generate new one
    const orderNumber = orderData.orderNumber || await getNextOrderNumber();

    // Map internal form data to specific Firestore flat structure + structured customer
    const payload = {
      // New Field
      orderNumber: orderNumber,
      // sepayId is usually set by backend, but if provided (e.g. manual link), save it
      sepayId: orderData.sepayId || null,

      // Legacy flat fields
      customerName: orderData.customer?.name || '',
      phone: orderData.customer?.phone || '',
      address: orderData.customer?.address || '',
      email: orderData.customer?.email || '',
      
      // Structured Customer Object
      customer: {
        id: orderData.customer?.id || '',
        name: orderData.customer?.name || '',
        phone: orderData.customer?.phone || '',
        address: orderData.customer?.address || '',
        email: orderData.customer?.email || '',
        city: orderData.customer?.city || '',
        country: orderData.customer?.country || ''
      },

      items: orderData.items || [], // New Array structure
      shippingCost: orderData.shippingCost || 0,
      total: orderData.total || 0,
      note: orderData.notes || '',
      status: (orderData.status || 'pending').toLowerCase(),
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      paymentStatus: orderData.paymentStatus || 'Unpaid',
      paymentMethod: orderData.paymentMethod || 'Cash'
    };
    await addDoc(ordersRef, payload);
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export const updateOrder = async (orderId: string, orderData: any): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    // Clean customer data to ensure no undefined values
    const safeCustomer = {
        id: orderData.customer?.id || '',
        name: orderData.customer?.name || '',
        phone: orderData.customer?.phone || '',
        address: orderData.customer?.address || '',
        email: orderData.customer?.email || '',
        city: orderData.customer?.city || '',
        country: orderData.customer?.country || ''
    };

    const payload = {
      // Legacy flat fields - Write them instead of deleting
      customerName: safeCustomer.name,
      phone: safeCustomer.phone,
      address: safeCustomer.address,
      email: safeCustomer.email,

      // Structured Customer Object
      customer: safeCustomer,

      items: orderData.items || [],
      shippingCost: orderData.shippingCost || 0,
      total: orderData.total || 0,
      note: orderData.notes || '',
      status: (orderData.status || 'pending').toLowerCase(),
      paymentStatus: orderData.paymentStatus || 'Unpaid',
      paymentMethod: orderData.paymentMethod || 'Cash',
      // Preserve sepayId if it exists in update data, typically it might be updated by backend
      ...(orderData.sepayId !== undefined && { sepayId: orderData.sepayId })
    };
    await updateDoc(orderRef, payload);
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    if (!orderId) throw new Error("Order ID is required");
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};