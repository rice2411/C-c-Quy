import { useEffect, useSyncExternalStore } from 'react';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOrders, addOrder, updateOrder, deleteOrder } from '@/services/orderService';

/**
 * Store đơn hàng dùng chung (module-level) — KHÔNG còn global context/provider.
 * LAZY: chỉ fetch khi consumer đầu tiên mount (Dashboard/Orders/...) thay vì eager
 * mỗi lần đăng nhập (deep-link vào /settings... không kéo cả list đơn nữa).
 * useSyncExternalStore → mọi consumer cùng re-render khi list đổi (CRUD).
 */
let orders: Order[] = [];
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
    orders = await fetchOrders();
    loaded = true;
  } catch (err) {
    // Nuốt lỗi nhưng vẫn tắt loading → không spinner quay mãi (token chưa sẵn lần đầu).
    console.error('useOrders load error:', err);
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

async function refreshOrders() {
  if (inflight) return inflight;
  inflight = fetchInto();
  return inflight;
}

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  createNewOrder: (data: any) => Promise<void>;
  modifyOrder: (id: string, data: any) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
}

export const useOrders = (): UseOrdersResult => {
  const { currentUser, userData } = useAuth();
  const list = useSyncExternalStore(subscribe, () => orders);
  const isLoading = useSyncExternalStore(subscribe, () => loading);

  useEffect(() => {
    ensureLoaded();
  }, []);

  // buildEditor cần auth → định nghĩa trong hook (không phải module-level).
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

  return {
    orders: list,
    loading: isLoading,
    refreshOrders,
    createNewOrder,
    modifyOrder,
    removeOrder,
  };
};
