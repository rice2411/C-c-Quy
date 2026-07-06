import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentAccountInput, PaymentAccount } from '@/types/paymentConfig';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  createPaymentAccount,
  deletePaymentAccount,
  fetchPaymentAccounts,
  setActivePaymentAccount,
} from '@/services/configurationService';

export interface UsePaymentAccountsResult {
  accounts: PaymentAccount[];
  /** TK đang active (isActive); fallback item đầu tiên; null nếu list rỗng. */
  activeAccount: PaymentAccount | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreatePaymentAccountInput) => Promise<PaymentAccount[]>;
  setActive: (id: string) => Promise<PaymentAccount[]>;
  remove: (id: string) => Promise<PaymentAccount[]>;
}

/**
 * Quản lý danh sách tài khoản nhận tiền (NHIỀU TK + 1 active) qua React Query.
 * - Cache theo `qk.paymentAccounts.all`: mọi consumer mount → fetch 1 lần (dedup).
 * - Mỗi mutation set cache từ response list + invalidate để đồng bộ server.
 * - An toàn khi list rỗng (accounts = [], activeAccount = null).
 */
export const usePaymentAccounts = (): UsePaymentAccountsResult => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.paymentAccounts.all,
    queryFn: fetchPaymentAccounts,
    enabled: !!currentUser,
  });

  const accounts = useMemo<PaymentAccount[]>(() => query.data ?? [], [query.data]);

  const activeAccount = useMemo<PaymentAccount | null>(() => {
    if (accounts.length === 0) return null;
    return accounts.find((a) => a.isActive) ?? accounts[0] ?? null;
  }, [accounts]);

  const applyList = useCallback(
    (list: PaymentAccount[]) => {
      queryClient.setQueryData(qk.paymentAccounts.all, list);
      queryClient.invalidateQueries({ queryKey: qk.paymentAccounts.all });
    },
    [queryClient],
  );

  const createMutation = useMutation({
    mutationFn: (input: CreatePaymentAccountInput) => createPaymentAccount(input),
    onSuccess: applyList,
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => setActivePaymentAccount(id),
    onSuccess: applyList,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deletePaymentAccount(id),
    onSuccess: applyList,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const create = useCallback(
    (input: CreatePaymentAccountInput) => createMutation.mutateAsync(input),
    [createMutation],
  );
  const setActive = useCallback((id: string) => setActiveMutation.mutateAsync(id), [setActiveMutation]);
  const remove = useCallback((id: string) => removeMutation.mutateAsync(id), [removeMutation]);

  const mutating =
    createMutation.isPending || setActiveMutation.isPending || removeMutation.isPending;

  const error = query.error
    ? (query.error as Error)?.message || 'Không tải được danh sách tài khoản thanh toán'
    : createMutation.error || setActiveMutation.error || removeMutation.error
      ? ((createMutation.error || setActiveMutation.error || removeMutation.error) as Error)?.message ||
        'Thao tác tài khoản thanh toán thất bại'
      : null;

  return {
    accounts,
    activeAccount,
    loading: query.isLoading,
    mutating,
    error,
    refresh,
    create,
    setActive,
    remove,
  };
};
