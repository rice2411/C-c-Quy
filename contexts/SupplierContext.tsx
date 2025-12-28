import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supplier } from '@/types';
import { fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/services/supplierService';

interface SupplierContextType {
  suppliers: Supplier[];
  loading: boolean;
  refreshSuppliers: () => Promise<void>;
  createSupplier: (data: Omit<Supplier, 'id'>) => Promise<void>;
  modifySupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  removeSupplier: (id: string) => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshSuppliers = async () => {
    const data = await fetchSuppliers();
    setSuppliers(data);
  };

  const createSupplier = async (data: Omit<Supplier, 'id'>) => {
    await addSupplier(data);
    await refreshSuppliers();
  };

  const modifySupplier = async (id: string, data: Partial<Supplier>) => {
    await updateSupplier(id, data);
    await refreshSuppliers();
  };

  const removeSupplier = async (id: string) => {
    await deleteSupplier(id);
    await refreshSuppliers();
  };

  return (
    <SupplierContext.Provider value={{ suppliers, loading, refreshSuppliers, createSupplier, modifySupplier, removeSupplier }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
};

