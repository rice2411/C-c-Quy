import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, Inbox, RefreshCw, RotateCcw, Send } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { useNotificationLog, useNotificationMutations } from '@/hooks/queries/useNotificationsQuery';
import type { AppNotification, NotificationKind, NotificationStatus } from '@/services/notificationService';

const PAGE_SIZE = 50;

/** createdAt/readAt có thể là ISO string hoặc Timestamp-like (apiClient revive). */
const formatTs = (v: AppNotification['createdAt']): string => {
  if (!v) return '—';
  try {
    if (typeof v === 'string') return new Date(v).toLocaleString('vi-VN');
    if (typeof (v as any).toDate === 'function') return (v as any).toDate().toLocaleString('vi-VN');
    if (typeof (v as any).toMillis === 'function') return new Date((v as any).toMillis()).toLocaleString('vi-VN');
  } catch {
    /* noop */
  }
  return '—';
};

const statusMeta: Record<NotificationStatus, { label: string; bg: string; text: string }> = {
  sent: { label: 'Đã gửi', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'Thất bại', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  pending: { label: 'Chờ gửi', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
};

/** Nhãn kênh (chung, dễ mở rộng nền tảng khác). */
const kindMeta: Record<NotificationKind, { label: string; icon: React.ReactNode }> = {
  zalo: { label: 'Zalo', icon: <Send className="h-3.5 w-3.5" /> },
  inapp: { label: 'Trong ứng dụng', icon: <Bell className="h-3.5 w-3.5" /> },
};

const LogTab: React.FC = () => {
  const [kind, setKind] = useState<'' | NotificationKind>('');
  const [status, setStatus] = useState<'' | NotificationStatus>('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({ kind: kind || undefined, status: status || undefined, page, limit: PAGE_SIZE }),
    [kind, status, page],
  );
  const { data, loading, fetching, error, refetch } = useNotificationLog(query);
  const { resend, resending } = useNotificationMutations();

  const items = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;

  const handleResend = async (n: AppNotification) => {
    try {
      await resend(n.id);
      toast.success('Đã gửi lại');
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gửi lại thất bại');
    }
  };

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Typography size="sm" variant="muted">Lịch sử gửi (thành công/thất bại) + sự kiện trong ứng dụng. Gửi lại khi thất bại.</Typography>
        <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={loading || fetching} leftIcon={<RefreshCw className="w-4 h-4" />}>Làm mới</Button>
      </Box>

      <Card padding="md">
        <Box layoutClassName="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Box layoutClassName="space-y-1">
            <Typography size="xs" variant="muted">Kênh</Typography>
            <Select fullWidth value={kind} onChange={(e) => { setKind(e.target.value as NotificationKind | ''); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="zalo">Zalo</option>
              <option value="inapp">Trong ứng dụng</option>
            </Select>
          </Box>
          <Box layoutClassName="space-y-1">
            <Typography size="xs" variant="muted">Trạng thái</Typography>
            <Select fullWidth value={status} onChange={(e) => { setStatus(e.target.value as NotificationStatus | ''); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="sent">Đã gửi</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Chờ gửi</option>
            </Select>
          </Box>
        </Box>
      </Card>

      <Card padding="none">
        {loading ? (
          <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
        ) : error ? (
          <Box layoutClassName="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <Typography textClassName="text-red-600 dark:text-red-400">Không tải được nhật ký.</Typography>
          </Box>
        ) : items.length === 0 ? (
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="Chưa có thông báo nào khớp bộ lọc." />
        ) : (
          <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Thời gian</TableHeaderCell>
                  <TableHeaderCell>Kênh</TableHeaderCell>
                  <TableHeaderCell>Nội dung</TableHeaderCell>
                  <TableHeaderCell>Đích</TableHeaderCell>
                  <TableHeaderCell>Trạng thái</TableHeaderCell>
                  <TableHeaderCell>{' '}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((n) => {
                  const sm = statusMeta[n.status] ?? statusMeta.sent;
                  const km = kindMeta[n.kind] ?? kindMeta.inapp;
                  return (
                    <TableRow key={n.id}>
                      <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatTs(n.createdAt)}</TableCell>
                      <TableCell>
                        <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">
                          <Box layoutClassName="inline-flex items-center gap-1">{km.icon}{km.label}</Box>
                        </Badge>
                      </TableCell>
                      <TableCell textClassName="max-w-md">
                        <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{n.title || '—'}</Typography>
                        {n.status === 'failed' && n.error ? (
                          <Typography as="p" size="xs" textClassName="truncate text-red-500 dark:text-red-400">{n.error}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell textClassName="text-slate-500 dark:text-slate-400 max-w-[10rem] truncate">{n.target || '—'}</TableCell>
                      <TableCell><Badge size="sm" borderClassName="border-transparent" backgroundClassName={sm.bg} textClassName={sm.text}>{sm.label}</Badge></TableCell>
                      <TableCell>
                        {n.kind === 'zalo' && n.status === 'failed' ? (
                          <Button variant="ghost" size="sm" onClick={() => handleResend(n)} disabled={resending} leftIcon={<RotateCcw className="w-4 h-4" />} textClassName="text-primary-600 dark:text-primary-400">Gửi lại</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {!loading && !error ? (
        <Box layoutClassName="flex items-center justify-between">
          <Typography size="sm" variant="muted">Trang {page}</Typography>
          <Box layoutClassName="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>Trước</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>Sau<ChevronRight className="w-4 h-4" /></Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default LogTab;
