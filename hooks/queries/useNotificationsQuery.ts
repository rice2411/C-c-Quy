/**
 * React Query hooks cho domain Notifications (nhật ký gửi + hộp thư in-app).
 * queryFn gọi thẳng notificationService. enabled theo currentUser (tránh 401).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchNotificationLog,
  fetchNotificationInbox,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  resendNotification,
  type NotificationLogQuery,
  type NotificationListResult,
  type AppNotification,
} from '@/services/notificationService';

export const useNotificationLog = (query: NotificationLogQuery) => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.notifications.log(query),
    queryFn: () => fetchNotificationLog(query),
    enabled: !!currentUser,
  });
  return {
    data: q.data as NotificationListResult | undefined,
    loading: q.isLoading,
    fetching: q.isFetching,
    error: q.error,
    refetch: async () => {
      await q.refetch();
    },
  };
};

/** Hộp thư in-app + số chưa đọc — tự làm mới 20s. */
export const useNotificationInbox = () => {
  const { currentUser } = useAuth();
  // 20s interval đã đủ; RQ mặc định KHÔNG poll khi tab ẩn (refetchIntervalInBackground=false).
  // Bỏ refetchOnWindowFocus (gây double-fetch mỗi lần alt-tab quay lại).
  const inbox = useQuery({
    queryKey: qk.notifications.inbox,
    queryFn: () => fetchNotificationInbox(20),
    enabled: !!currentUser,
    refetchInterval: 20000,
  });
  const unread = useQuery({
    queryKey: qk.notifications.unread,
    queryFn: fetchUnreadCount,
    enabled: !!currentUser,
    refetchInterval: 20000,
  });
  return {
    items: (inbox.data ?? []) as AppNotification[],
    unreadCount: unread.data ?? 0,
    loading: inbox.isLoading,
  };
};

export const useNotificationMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({ mutationFn: (id: string) => markNotificationRead(id), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => markAllNotificationsRead(), onSuccess: invalidate });
  const resend = useMutation({ mutationFn: (id: string) => resendNotification(id), onSuccess: invalidate });

  return {
    markRead: (id: string) => markRead.mutateAsync(id),
    markAllRead: () => markAll.mutateAsync(),
    resend: (id: string) => resend.mutateAsync(id),
    resending: resend.isPending,
  };
};
