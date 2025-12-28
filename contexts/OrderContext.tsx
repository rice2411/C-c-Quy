import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, PaymentStatus } from '@/types';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const fetchedOrders = await fetchOrders();
    setOrders(fetchedOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshOrders = async () => {
    const fetchedOrders = await fetchOrders();
    setOrders(fetchedOrders);
  };

  const createNewOrder = async (data: any) => {
    await addOrder(data);
    await refreshOrders();
  };

  const modifyOrder = async (id: string, data: any) => {
    await updateOrder(id, data);
    await refreshOrders();
  };

  const removeOrder = async (id: string) => {
    await deleteOrder(id);
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