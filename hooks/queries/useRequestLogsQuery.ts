/**
 * React Query hooks cho domain Request Logs (epic #58 — P8).
 *
 * - queryFn GỌI THẲNG service hiện có (requestLogService) — KHÔNG viết lại HTTP.
 * - Key động theo `query` (qk.requestLogs.list/stats) → đổi filter/trang sẽ refetch,
 *   các filter trùng dùng lại cache (dedup).
 * - Query `enabled: !!currentUser` để tránh gọi API 401 ở màn login.
 * - KHÔNG nuốt lỗi: caller (component) bắt error → hiện thông báo.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchRequestLogs,
  fetchRequestLogStats,
  type RequestLogPage,
  type RequestLogQuery,
  type RequestLogStats,
} from '@/services/requestLogService';

export interface UseRequestLogsResult {
  data: RequestLogPage | undefined;
  loading: boolean;
  fetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useRequestLogs = (query: RequestLogQuery): UseRequestLogsResult => {
  const { currentUser } = useAuth();
  const result = useQuery({
    queryKey: qk.requestLogs.list(query),
    queryFn: () => fetchRequestLogs(query),
    enabled: !!currentUser,
  });
  return {
    data: result.data,
    loading: result.isLoading,
    fetching: result.isFetching,
    error: result.error,
    refetch: async () => {
      await result.refetch();
    },
  };
};

export interface UseRequestLogStatsResult {
  data: RequestLogStats | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Stats chỉ tải khi `enabled` (page === 1 ở caller) — tránh tải lại stats khi
 * lật trang. Key gồm {from,to} để cache theo khoảng thời gian lọc.
 */
export const useRequestLogStats = (
  query: Pick<RequestLogQuery, 'from' | 'to'>,
  enabled = true,
): UseRequestLogStatsResult => {
  const { currentUser } = useAuth();
  const result = useQuery({
    queryKey: qk.requestLogs.stats(query),
    queryFn: () => fetchRequestLogStats(query),
    enabled: !!currentUser && enabled,
  });
  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error,
    refetch: async () => {
      await result.refetch();
    },
  };
};
