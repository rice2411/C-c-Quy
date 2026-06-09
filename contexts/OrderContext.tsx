import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, PaymentStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOrders, addOrder, updateOrder, deleteOrder } from '@/services/orderService';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  createNewOrder: (data: any) => Promise<void>;
  modifyOrder: (id: string, data: any) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      // QUAN TRỌNG: nếu fetch lỗi (vd token chưa sẵn lần đầu) mà không bắt,
      // setLoading(false) sẽ không chạy → spinner quay mãi. Luôn tắt ở finally.
      console.error('OrderContext loadData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ fetch khi đã có currentUser (auth khôi phục xong) — tránh gọi API thiếu
  // token lúc app mới mở (PWA iOS) khiến trang trống tới khi bấm refresh.
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    loadData();
  }, [currentUser]);

  const refreshOrders = async () => {
    try {
      const fetchedOrders = await fetchOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('OrderContext refreshOrders error:', err);
    }
  };

  const buildEditor = () => {
    const uid = currentUser?.uid ?? userData?.uid ?? '';
    const displayName =
      (userData as any)?.customName ||
      (userData as any)?.displayName ||
      (currentUser as any)?.displayName ||
      '';
    const email = (currentUser as any)?.email || (userData as any)?.email || '';
    return { uid, role: userData?.role, displayName, email };
  };

  const createNewOrder = async (data: any) => {
    await addOrder(data);
    await refreshOrders();
  };

  const modifyOrder = async (id: string, data: any) => {
    await updateOrder(id, data, buildEditor());
    await refreshOrders();
  };

  const removeOrder = async (id: string) => {
    await deleteOrder(id, buildEditor());
    await refreshOrders();
  };

  return (
    <OrderContext.Provider value={{ orders, loading, refreshOrders, createNewOrder, modifyOrder, removeOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
