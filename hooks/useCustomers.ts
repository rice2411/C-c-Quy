/**
 * Hook khách hàng qua React Query (epic #58 — issue #67, migrate domain Customer).
 *
 * Trước đây dùng store module-level + useSyncExternalStore (customers/loading/loaded/
 * inflight/subscribers/emit + ensureLoaded + CRUD module-level). Nay thay HOÀN TOÀN
 * bằng React Query:
 * - `useQuery(qk.customers.all, fetchCustomers, { enabled: !!currentUser })` — fetch
 *   ON-DEMAND khi consumer mount + auth ready, nhiều consumer cùng key được dedup,
 *   share cache (OrderForm + OrderFormCustomerSection + Customers page cùng 1 list).
 * - 3 useMutation (add/update/delete) → onSuccess invalidate `qk.customers.all`.
 * - queryFn/mutationFn GỌI THẲNG customerService, KHÔNG viết lại HTTP.
 * - KHÔNG nuốt lỗi: mutateAsync reject lên caller để component toast (rule firestore-safety).
 *
 * GIỮ NGUYÊN signature `UseCustomersResult` → consumer không phải đổi.
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customerService';

export interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  refreshCustomers: () => Promise<void>;
  createNewCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  modifyCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

export const useCustomers = (): UseCustomersResult => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.customers.all,
    queryFn: fetchCustomers,
    enabled: !!currentUser,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.customers.all });

  const addMutation = useMutation({
    mutationFn: (data: Omit<Customer, 'id'>) => addCustomer(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => updateCustomer(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: invalidate,
  });

  const refreshCustomers = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const createNewCustomer = useCallback(
    async (data: Omit<Customer, 'id'>) => {
      await addMutation.mutateAsync(data);
    },
    [addMutation],
  );

  const modifyCustomer = useCallback(
    async (id: string, data: Partial<Customer>) => {
      await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation],
  );

  const removeCustomer = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    customers: query.data ?? [],
    loading: query.isLoading,
    refreshCustomers,
    createNewCustomer,
    modifyCustomer,
    removeCustomer,
  };
};
