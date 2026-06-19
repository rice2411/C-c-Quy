import { useEffect, useSyncExternalStore } from 'react';
import { Customer } from '@/types';
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customerService';

/**
 * Store khách hàng dùng chung (module-level) — KHÔNG còn global context/provider.
 * Fetch ON-DEMAND khi consumer đầu tiên mount (Customers page / form đơn), thay vì
 * eager mỗi lần đăng nhập. Dùng useSyncExternalStore để mọi consumer co-mount
 * (OrderForm + OrderFormCustomerSection) cùng re-render khi list đổi (CRUD).
 */
let customers: Customer[] = [];
let loading = false;
let loaded = false;
let inflight: Promise<void> | null = null;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((fn) => fn());

const subscribe = (cb: () => void) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

async function fetchInto() {
  try {
    customers = await fetchCustomers();
    loaded = true;
  } catch (err) {
    // QUAN TRỌNG: nuốt lỗi nhưng vẫn tắt loading → không spinner quay mãi.
    console.error('useCustomers load error:', err);
  } finally {
    loading = false;
    inflight = null;
    emit();
  }
}

function ensureLoaded() {
  if (loaded || inflight) return;
  loading = true;
  emit();
  inflight = fetchInto();
}

async function refreshCustomers() {
  if (inflight) return inflight;
  inflight = fetchInto();
  return inflight;
}

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

export interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  refreshCustomers: () => Promise<void>;
  createNewCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  modifyCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

export const useCustomers = (): UseCustomersResult => {
  const list = useSyncExternalStore(subscribe, () => customers);
  const isLoading = useSyncExternalStore(subscribe, () => loading);

  useEffect(() => {
    ensureLoaded();
  }, []);

  return {
    customers: list,
    loading: isLoading,
    refreshCustomers,
    createNewCustomer,
    modifyCustomer,
    removeCustomer,
  };
};
