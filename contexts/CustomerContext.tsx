import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '@/types';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshCustomers = async () => {
    const data = await fetchCustomers();
    setCustomers(data);
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