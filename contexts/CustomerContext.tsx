import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customerService';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  refreshCustomers: () => Promise<void>;
  createNewCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  modifyCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      // QUAN TRỌNG: nếu fetch lỗi mà không bắt, setLoading(false) sẽ không chạy
      // → spinner quay mãi (đúng lỗi "tab customer load mãi không xong").
      console.error('CustomerContext loadData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ fetch khi đã có currentUser (auth khôi phục xong) — tránh gọi API thiếu
  // token lúc app mới mở (PWA iOS).
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    loadData();
  }, [currentUser]);

  const refreshCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('CustomerContext refreshCustomers error:', err);
    }
  };

  const createNewCustomer = async (data: Omit<Customer, 'id'>) => {
    await addCustomer(data);
    await refreshCustomers();
  };

  const modifyCustomer = async (id: string, data: Partial<Customer>) => {
    await updateCustomer(id, data);
    await refreshCustomers();
  };

  const removeCustomer = async (id: string) => {
    await deleteCustomer(id);
    await refreshCustomers();
  };

  return (
    <CustomerContext.Provider value={{ customers, loading, refreshCustomers, createNewCustomer, modifyCustomer, removeCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};