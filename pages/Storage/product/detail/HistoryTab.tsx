/**
 * HistoryTab — danh sách lịch sử chỉnh sửa sản phẩm.
 */
import React from 'react';
import { Calendar } from 'lucide-react';
import type { ProductVersion } from '@/types';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const formatDateShort = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

interface HistoryTabProps {
  versions: ProductVersion[];
  loading: boolean;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ versions, loading }) => (
  <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
    <Heading level={3} textClassName="text-sm font-bold uppercase tracking-wider">Lịch sử chỉnh sửa</Heading>
    {loading ? (
      <Box layoutClassName="flex items-center justify-center py-4"><Spinner size="md" /></Box>
    ) : versions.length === 0 ? (
      <Typography size="sm" variant="muted">Chưa có lịch sử chỉnh sửa.</Typography>
    ) : (
      <Box layoutClassName="space-y-2">
        {versions.map((v) => (
          <Box key={v.id} layoutClassName="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
            <Box layoutClassName="flex items-center justify-between gap-2">
              <Typography size="xs" layoutClassName="font-bold uppercase tracking-wide">{v.action}</Typography>
              <Typography size="xs" variant="muted">
                <Calendar className="inline h-3 w-3" /> {formatDateShort(v.editedAt)}
              </Typography>
            </Box>
            {v.changes && Object.keys(v.changes).length > 0 ? (
              <Box layoutClassName="mt-2 space-y-0.5 text-xs">
                {Object.entries(v.changes).map(([k, val]) => (
                  <Box key={k} layoutClassName="flex gap-2">
                    <Typography size="xs" variant="muted">{k}:</Typography>
                    <Typography size="xs" layoutClassName="font-mono truncate">{JSON.stringify(val)}</Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    )}
  </Card>
);

export default HistoryTab;
