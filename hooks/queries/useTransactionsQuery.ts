/**
 * React Query hooks cho domain Transactions + Revenue (epic #58 — P7).
 *
 * - queryFn/mutationFn GỌI THẲNG service hiện có (transactionService/revenueService) —
 *   KHÔNG viết lại HTTP, giữ nguyên revive Timestamp ở tầng dưới.
 * - Mọi query `enabled: !!currentUser` để tránh chạy trước khi auth ready → 401.
 * - Sau mutation (markExternal/linkOrder) invalidate `qk.transactions.all`.
 * - KHÔNG nuốt lỗi: caller (component) bắt error / dùng `error` để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchTransactions,
  fetchTransactionsByOrderNumber,
  linkTransactionOrder,
  markTransactionExternal,
} from '@/services/transactionService';
import { fetchRevenueReport, RevenueReport } from '@/services/revenueService';

/* ───────────────────────── Transactions ──────────────────────────────── */
export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export const useTransactions = (): UseTransactionsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.transactions.all,
    queryFn: fetchTransactions,
    enabled: !!currentUser,
  });
  return {
    transactions: query.data ?? [],
    loading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: () => query.refetch(),
  };
};

export interface UseTransactionsByOrderResult {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
}

export const useTransactionsByOrderNumber = (
  orderNumber: string | undefined,
  enabled = true,
): UseTransactionsByOrderResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.transactions.byOrderNumber(orderNumber ?? ''),
    queryFn: () => fetchTransactionsByOrderNumber(orderNumber as string),
    enabled: !!orderNumber && !!currentUser && enabled,
  });
  return {
    transactions: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
};

/* ───────────────────────── Mutations ─────────────────────────────────── */
export interface MarkExternalArgs {
  transactionId: string;
  isExternal: boolean;
}

export interface LinkOrderArgs {
  transactionId: string;
  orderNumber: string;
}

export interface UseTransactionMutationsResult {
  markExternal: (args: MarkExternalArgs) => Promise<void>;
  linkOrder: (args: LinkOrderArgs) => Promise<void>;
}

export const useTransactionMutations = (): UseTransactionMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.transactions.all });

  const markExternalMutation = useMutation({
    mutationFn: ({ transactionId, isExternal }: MarkExternalArgs) =>
      markTransactionExternal(transactionId, isExternal),
    onSuccess: invalidate,
  });
  const linkOrderMutation = useMutation({
    mutationFn: ({ transactionId, orderNumber }: LinkOrderArgs) =>
      linkTransactionOrder(transactionId, orderNumber),
    onSuccess: invalidate,
  });

  return {
    markExternal: (args) => markExternalMutation.mutateAsync(args),
    linkOrder: (args) => linkOrderMutation.mutateAsync(args),
  };
};

/* ───────────────────────── Revenue report ────────────────────────────── */
export interface UseRevenueReportParams {
  from: string;
  to: string;
}

export interface UseRevenueReportResult {
  report: RevenueReport | null;
  loading: boolean;
  error: Error | null;
}

export const useRevenueReport = (params: UseRevenueReportParams): UseRevenueReportResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.revenue.report(params),
    queryFn: () => fetchRevenueReport(params.from, params.to),
    enabled: !!currentUser,
  });
  return {
    report: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
};
