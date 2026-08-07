import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  patchOrderFields,
  deleteOrder,
  type OrderUpdateEditor,
} from '@/services/orderService';

/**
 * Domain ORDERS qua React Query (epic #58 — P4).
 *
 * - queryFn/mutationFn GỌI THẲNG orderService — KHÔNG viết lại HTTP. Service vẫn
 *   tự revive Timestamp + gửi Zalo notify ở tầng dưới.
 * - `enabled: !!currentUser` để tránh fetch trước khi auth ready (token chưa sẵn → 401).
 * - Sau mỗi mutation invalidate `qk.orders.all` (prefix match → xoá luôn key con
 *   như next-number). Caller (page) tự toast khi lỗi (rule data-safety).
 * - structuralSharing:false set global trong queryClient → RQ KHÔNG phá `.toDate()`
 *   của Timestamp object trong order. Field ngày dùng helper dateUtil ở tầng UI.
 * - GIỮ NGUYÊN signature cũ (orders/loading/refreshOrders/createNewOrder/
 *   modifyOrder/removeOrder) để mọi consumer không phải đổi.
 * - `buildEditor()` cần auth → định nghĩa trong hook, truyền vào update/delete
 *   mutationFn (BE check quyền + ghi history theo editor).
 */
export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  createNewOrder: (data: any) => Promise<void>;
  modifyOrder: (id: string, data: any) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
  /** Đổi trạng thái đơn — đường nhẹ/nhanh (optimistic). */
  changeStatus: (id: string, status: string) => Promise<void>;
  /** Patch field nhanh (paymentStatus/paymentMethod/deliveryType) — đường nhẹ (optimistic). */
  patchFields: (id: string, patch: Record<string, any>) => Promise<void>;
}

export const useOrders = (): UseOrdersResult => {
  const { currentUser, userData } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.orders.all,
    queryFn: fetchOrders,
    enabled: !!currentUser,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.orders.all });

  // buildEditor cần auth → định nghĩa trong hook (không phải module-level).
  const buildEditor = (): OrderUpdateEditor => {
    const uid = currentUser?.uid ?? userData?.uid ?? '';
    const displayName =
      (userData as any)?.customName ||
      (userData as any)?.displayName ||
      (currentUser as any)?.displayName ||
      '';
    const email = (currentUser as any)?.email || (userData as any)?.email || '';
    return { uid, role: userData?.role, displayName, email };
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => addOrder(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateOrder(id, data, buildEditor()),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id, buildEditor()),
    onSuccess: invalidate,
  });
  // Đổi trạng thái: OPTIMISTIC (cập nhật cache ngay) + endpoint nhẹ → UI phản hồi tức thì,
  // refetch nền ở onSettled (không chặn). Zalo fire-and-forget trong service.
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status, buildEditor()),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: qk.orders.all });
      const prev = queryClient.getQueryData<Order[]>(qk.orders.all);
      queryClient.setQueryData<Order[]>(qk.orders.all, (old) =>
        (old ?? []).map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.orders.all, ctx.prev);
    },
    onSettled: () => invalidate(),
  });
  // Patch field nhanh (paymentStatus/paymentMethod/deliveryType): optimistic + endpoint nhẹ.
  const patchFieldsMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, any> }) =>
      patchOrderFields(id, patch, buildEditor()),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: qk.orders.all });
      const prev = queryClient.getQueryData<Order[]>(qk.orders.all);
      queryClient.setQueryData<Order[]>(qk.orders.all, (old) =>
        (old ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.orders.all, ctx.prev);
    },
    onSettled: () => invalidate(),
  });

  const refreshOrders = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const createNewOrder = useCallback(
    async (data: any) => {
      await addMutation.mutateAsync(data);
    },
    [addMutation],
  );

  const modifyOrder = useCallback(
    async (id: string, data: any) => {
      await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation],
  );

  const removeOrder = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const changeStatus = useCallback(
    async (id: string, status: string) => {
      await changeStatusMutation.mutateAsync({ id, status });
    },
    [changeStatusMutation],
  );

  const patchFields = useCallback(
    async (id: string, patch: Record<string, any>) => {
      await patchFieldsMutation.mutateAsync({ id, patch });
    },
    [patchFieldsMutation],
  );

  return {
    orders: query.data ?? [],
    loading: query.isLoading,
    refreshOrders,
    createNewOrder,
    modifyOrder,
    removeOrder,
    changeStatus,
    patchFields,
  };
};
