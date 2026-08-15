/**
 * Hook bàn ăn tại chỗ (dine-in) qua React Query — theo pattern useCustomers.
 * queryFn/mutationFn gọi thẳng tableService, KHÔNG viết lại HTTP. mutateAsync
 * reject lên caller để component toast (rule data-safety). Mọi mutation onSuccess
 * invalidate qk.tables.all để map + bảng danh sách tự refresh.
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DiningTable, DiningTableInput } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchTables,
  addTable,
  updateTable,
  deleteTable,
  checkoutTable,
} from '@/services/tableService';

export interface UseTablesResult {
  tables: DiningTable[];
  loading: boolean;
  refreshTables: () => Promise<void>;
  createTable: (data: Omit<DiningTableInput, 'id'>) => Promise<DiningTable>;
  modifyTable: (id: string, data: Partial<Omit<DiningTableInput, 'id'>>) => Promise<DiningTable>;
  removeTable: (id: string) => Promise<void>;
  closeTable: (orderId: string) => Promise<void>;
}

export const useTables = (): UseTablesResult => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.tables.all,
    queryFn: fetchTables,
    enabled: !!currentUser,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.tables.all });

  const addMutation = useMutation({
    mutationFn: (data: Omit<DiningTableInput, 'id'>) => addTable(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<DiningTableInput, 'id'>> }) =>
      updateTable(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: invalidate,
  });
  const checkoutMutation = useMutation({
    mutationFn: (orderId: string) => checkoutTable(orderId),
    onSuccess: invalidate,
  });

  const refreshTables = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const createTable = useCallback(
    (data: Omit<DiningTableInput, 'id'>) => addMutation.mutateAsync(data),
    [addMutation],
  );
  const modifyTable = useCallback(
    (id: string, data: Partial<Omit<DiningTableInput, 'id'>>) =>
      updateMutation.mutateAsync({ id, data }),
    [updateMutation],
  );
  const removeTable = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );
  const closeTable = useCallback(
    async (orderId: string) => {
      await checkoutMutation.mutateAsync(orderId);
    },
    [checkoutMutation],
  );

  return {
    tables: query.data ?? [],
    loading: query.isLoading,
    refreshTables,
    createTable,
    modifyTable,
    removeTable,
    closeTable,
  };
};
