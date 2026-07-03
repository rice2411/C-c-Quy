import { apiClient } from '@/services/api/client';

export type NotificationKind = 'zalo' | 'inapp';
export type NotificationStatus = 'sent' | 'failed' | 'pending';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  category?: string | null;
  title?: string | null;
  body?: string | null;
  target?: string | null;
  status: NotificationStatus;
  error?: string | null;
  triggeredBy?: string | null;
  readAt?: string | { toMillis?: () => number } | null;
  createdAt?: string | { toMillis?: () => number; toDate?: () => Date };
}

export interface NotificationListResult {
  items: AppNotification[];
  hasMore: boolean;
}

export interface NotificationLogQuery {
  kind?: NotificationKind;
  status?: NotificationStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const clean = (p: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ''));

/** Nhật ký gửi (mặc định kind=zalo cho màn nhật ký). */
export const fetchNotificationLog = async (q: NotificationLogQuery = {}): Promise<NotificationListResult> => {
  const res = await apiClient.get<NotificationListResult>('/notifications', { params: clean(q as Record<string, unknown>) });
  return res.data ?? { items: [], hasMore: false };
};

/** Hộp thư in-app (chuông). */
export const fetchNotificationInbox = async (limit = 20): Promise<AppNotification[]> => {
  const res = await apiClient.get<AppNotification[]>('/notifications/inbox', { params: { limit } });
  return res.data ?? [];
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return res.data?.count ?? 0;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.post('/notifications/read-all');
};

/** Gửi lại 1 thông báo Zalo failed. */
export const resendNotification = async (id: string): Promise<void> => {
  await apiClient.post(`/zalo/resend/${id}`);
};
