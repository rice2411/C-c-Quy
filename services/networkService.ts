import { apiClient } from '@/services/api/client';

/** Trạng thái mạng của client + danh sách màn đang bật guard. */
export interface NetworkStatus {
  configured: boolean; // đã cấu hình dải mạng nào chưa
  allowed: boolean; // IP hiện tại có thuộc dải cho phép không
  ip: string;
  guardedScreens: string[]; // route yêu cầu mạng được duyệt
}

/** 1 dải mạng cho phép. */
export interface NetworkRange {
  id: string;
  label: string | null;
  ipCidr: string;
  active: boolean;
  createdAt?: string;
}

const num = (v: unknown): boolean => v === true;

export async function fetchNetworkStatus(): Promise<NetworkStatus> {
  const { data } = await apiClient.get('/network/status');
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    configured: num(d.configured),
    allowed: num(d.allowed),
    ip: typeof d.ip === 'string' ? d.ip : '',
    guardedScreens: Array.isArray(d.guardedScreens)
      ? (d.guardedScreens.filter((s) => typeof s === 'string') as string[])
      : [],
  };
}

export async function fetchCurrentIp(): Promise<{ ip: string; suggestedCidr: string }> {
  const { data } = await apiClient.get('/network/current-ip');
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    ip: typeof d.ip === 'string' ? d.ip : '',
    suggestedCidr: typeof d.suggestedCidr === 'string' ? d.suggestedCidr : '',
  };
}

export async function fetchNetworks(): Promise<NetworkRange[]> {
  const { data } = await apiClient.get<NetworkRange[]>('/network/networks');
  return Array.isArray(data) ? data : [];
}

export async function upsertNetwork(input: {
  id?: string;
  label?: string;
  ipCidr: string;
  active?: boolean;
}): Promise<NetworkRange> {
  const { data } = await apiClient.post<NetworkRange>('/network/networks', input);
  return data;
}

export async function deleteNetwork(id: string): Promise<void> {
  await apiClient.delete(`/network/networks/${id}`);
}

export async function fetchGuardedScreens(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/network/guard');
  return Array.isArray(data) ? data.filter((s) => typeof s === 'string') : [];
}

export async function saveGuardedScreens(routes: string[]): Promise<string[]> {
  const { data } = await apiClient.put<string[]>('/network/guard', { routes });
  return Array.isArray(data) ? data : [];
}
