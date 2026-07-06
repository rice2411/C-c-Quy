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
  fetchRequestLogTimeseries,
  fetchRequestLogErrorGroups,
  fetchHealth,
  type RequestLogPage,
  type RequestLogQuery,
  type RequestLogStats,
  type RequestLogTimePoint,
  type RequestLogErrorGroup,
  type HealthStatus,
} from '@/services/requestLogService';

/** Tham số chung cho stats/timeseries: khoảng thời gian + lọc lỗi. */
type StatsQuery = Pick<RequestLogQuery, 'from' | 'to'> & { errorsOnly?: boolean };
type TimeseriesQuery = StatsQuery & { bucket?: 'hour' | 'day' };

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
  query: StatsQuery,
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

export interface UseRequestLogTimeseriesResult {
  data: RequestLogTimePoint[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/** Chuỗi thời gian lưu lượng cho biểu đồ (gom theo giờ/ngày). */
export const useRequestLogTimeseries = (
  query: TimeseriesQuery,
  enabled = true,
): UseRequestLogTimeseriesResult => {
  const { currentUser } = useAuth();
  const result = useQuery({
    queryKey: qk.requestLogs.timeseries(query),
    queryFn: () => fetchRequestLogTimeseries(query),
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

/** Gom lỗi theo endpoint+status (kiểu Sentry). */
export const useRequestLogErrorGroups = (
  query: Pick<RequestLogQuery, 'from' | 'to'> & { limit?: number },
  enabled = true,
) => {
  const { currentUser } = useAuth();
  const result = useQuery({
    queryKey: qk.requestLogs.errorGroups(query),
    queryFn: () => fetchRequestLogErrorGroups(query),
    enabled: !!currentUser && enabled,
  });
  return {
    data: result.data as RequestLogErrorGroup[] | undefined,
    loading: result.isLoading,
    error: result.error,
    refetch: async () => {
      await result.refetch();
    },
  };
};

/** Sức khỏe hệ thống (/health) — tự làm mới mỗi 30s. */
export const useHealth = (enabled = true) => {
  const { currentUser } = useAuth();
  const result = useQuery({
    queryKey: qk.requestLogs.health,
    queryFn: fetchHealth,
    enabled: !!currentUser && enabled,
    refetchInterval: 30000,
  });
  return {
    data: result.data as HealthStatus | undefined,
    loading: result.isLoading,
    error: result.error,
    refetch: async () => {
      await result.refetch();
    },
  };
};
