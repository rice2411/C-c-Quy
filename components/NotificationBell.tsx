import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { useNotificationInbox, useNotificationMutations } from '@/hooks/queries/useNotificationsQuery';
import type { AppNotification } from '@/services/notificationService';

/** createdAt có thể là ISO string hoặc Timestamp-like → "x phút trước". */
const relTime = (v: AppNotification['createdAt']): string => {
  let ms: number | null = null;
  try {
    if (typeof v === 'string') ms = new Date(v).getTime();
    else if (v && typeof (v as any).toMillis === 'function') ms = (v as any).toMillis();
    else if (v && typeof (v as any).toDate === 'function') ms = (v as any).toDate().getTime();
  } catch {
    ms = null;
  }
  if (!ms || Number.isNaN(ms)) return '';
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
};

const isUnread = (n: AppNotification): boolean => !n.readAt;

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { items, unreadCount } = useNotificationInbox();
  const { markRead, markAllRead } = useNotificationMutations();

  // Đóng khi click ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onItem = (n: AppNotification) => {
    if (isUnread(n)) void markRead(n.id);
  };

  return (
    <Box layoutClassName="relative" ref={ref}>
      <IconButton
        label="Thông báo"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        layoutClassName="relative rounded-full p-2"
        textClassName="text-slate-500 dark:text-slate-400"
        hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <Box
            layoutClassName="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1"
            backgroundClassName="bg-red-500"
          >
            <Typography as="span" size="inherit" layoutClassName="text-[10px] font-bold leading-none" textClassName="text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Typography>
          </Box>
        ) : null}
      </IconButton>

      {open ? (
        <Box
          layoutClassName="fixed left-2 right-2 top-[4.5rem] z-50 max-h-[80vh] overflow-hidden rounded-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-80"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border border-slate-200 dark:border-slate-700"
          shadowClassName="shadow-xl"
        >
          <Box
            layoutClassName="flex items-center justify-between px-4 py-3"
            borderClassName="border-b border-slate-100 dark:border-slate-700"
          >
            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">
              Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Typography>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void markAllRead()}
                leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
                layoutClassName="px-1 py-0.5"
                textClassName="text-primary-600 dark:text-primary-400"
              >
                Đọc hết
              </Button>
            ) : null}
          </Box>

          <Box layoutClassName="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <Box layoutClassName="flex flex-col items-center gap-2 px-4 py-8">
                <Inbox className="h-6 w-6 text-slate-300" />
                <Typography as="span" size="sm" variant="muted">Chưa có thông báo.</Typography>
              </Box>
            ) : (
              items.map((n) => (
                <Box
                  key={n.id}
                  onClick={() => onItem(n)}
                  layoutClassName="flex cursor-pointer items-start gap-2 px-4 py-3"
                  borderClassName="border-b border-slate-50 dark:border-slate-700/50"
                  backgroundClassName={isUnread(n) ? 'bg-primary-50/50 dark:bg-primary-950/20' : 'bg-transparent'}
                  hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <Box
                    layoutClassName="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    backgroundClassName={isUnread(n) ? 'bg-primary-500' : 'bg-transparent'}
                  />
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">
                      {n.title || 'Thông báo'}
                    </Typography>
                    {n.body ? (
                      <Typography as="p" size="xs" layoutClassName="line-clamp-2" textClassName="text-slate-500 dark:text-slate-400">
                        {n.body}
                      </Typography>
                    ) : null}
                    <Typography as="span" size="xs" variant="muted">{relTime(n.createdAt)}</Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Box
            layoutClassName="px-4 py-2"
            borderClassName="border-t border-slate-100 dark:border-slate-700"
            backgroundClassName="bg-slate-50/50 dark:bg-slate-900/30"
          >
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              textClassName="text-slate-600 dark:text-slate-300"
            >
              Xem tất cả nhật ký
            </Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default NotificationBell;
