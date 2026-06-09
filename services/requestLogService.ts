import { apiClient } from '@/services/api/client';

export interface RequestLogGeo {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface RequestLog {
  id: string;
  method: string;
  path: string;
  query?: string;
  statusCode: number;
  durationMs: number;
  responseSize?: number | null;
  ip: string;
  geo: RequestLogGeo | null;
  uid: string | null;
  email: string | null;
  role: string | null;
  userAgent: string;
  referer?: string | null;
  body?: string | null;
  timestamp: { toDate: () => Date; toMillis: () => number };
}

export interface RequestLogQuery {
  from?: string;
  to?: string;
  method?: string;
  status?: number;
  uid?: string;
  email?: string;
  ip?: string;
  page?: number;
  limit?: number;
}

export interface RequestLogPage {
  items: RequestLog[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RequestLogStats {
  scanned: number;
  total: number;
  errorCount: number;
  uniqueIps: number;
  topPaths: Array<{ path: string; count: number }>;
  topIps: Array<{ ip: string; country?: string; count: number }>;
}

/** Bỏ các field undefined để không gửi query rỗng. */
const clean = (params: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

export const fetchRequestLogs = async (params: RequestLogQuery = {}): Promise<RequestLogPage> => {
  const res = await apiClient.get<RequestLogPage>('/request-logs', { params: clean(params as Record<string, unknown>) });
  return res.data;
};

export const fetchRequestLogStats = async (
  params: Pick<RequestLogQuery, 'from' | 'to'> = {},
): Promise<RequestLogStats> => {
  const res = await apiClient.get<RequestLogStats>('/request-logs/stats', { params: clean(params as Record<string, unknown>) });
  return res.data;
};
