/**
 * React Query hook cho domain Commission summaries (epic #58 — P7, dùng cho Dashboard).
 *
 * - queryFn GỌI THẲNG commissionService (fetchCommissionSummaries) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước auth → 401).
 * - KHÔNG nuốt lỗi: caller dùng `error` để xử lý.
 *
 * Lưu ý: chỉ migrate phần đọc summaries cho Dashboard (epic #58). Các mutation
 * markPaid/markPending của trang Commission KHÔNG thuộc phạm vi P7.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchCommissionSummaries,
  CollaboratorCommissionSummary,
} from '@/services/commissionService';

export interface UseCommissionSummariesResult {
  summaries: CollaboratorCommissionSummary[];
  loading: boolean;
  error: Error | null;
}

export const useCommissionSummaries = (): UseCommissionSummariesResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.commission.summaries,
    queryFn: fetchCommissionSummaries,
    enabled: !!currentUser,
  });
  return {
    summaries: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
};
