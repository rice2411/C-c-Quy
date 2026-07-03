import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bug, Inbox, RefreshCw } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { useRequestLogErrorGroups } from '@/hooks/queries/useRequestLogsQuery';
import { statusBadgeClass, methodBadgeClass } from './logFormat';

type RangeKey = '24h' | '7d' | '30d';
const RANGES: { key: RangeKey; label: string; ms: number }[] = [
  { key: '24h', label: '24 giờ', ms: 24 * 3600 * 1000 },
  { key: '7d', label: '7 ngày', ms: 7 * 86400 * 1000 },
  { key: '30d', label: '30 ngày', ms: 30 * 86400 * 1000 },
];

const nf = (n: number) => n.toLocaleString('vi-VN');

/** "x phút/giờ/ngày trước". */
const relTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s trước`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
};

/** Ngưỡng cảnh báo: tổng 5xx trong kỳ vượt số này → banner đỏ. */
const ALERT_5XX = 10;

const ErrorGroupsTable: React.FC = () => {
  const [rangeKey, setRangeKey] = useState<RangeKey>('7d');
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
  const [nowMs, setNowMs] = useState(() => Date.now());

  const from = useMemo(() => new Date(nowMs - range.ms).toISOString(), [nowMs, range.ms]);
  const to = useMemo(() => new Date(nowMs).toISOString(), [nowMs]);

  const q = useRequestLogErrorGroups({ from, to, limit: 100 });
  const groups = q.data ?? [];
  const totalErrors = groups.reduce((s, g) => s + g.count, 0);
  const total5xx = groups.filter((g) => g.status >= 500).reduce((s, g) => s + g.count, 0);

  const refresh = () => {
    setNowMs(Date.now());
    void q.refetch();
  };

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <Button key={r.key} variant={r.key === rangeKey ? 'primary' : 'secondary'} size="sm" onClick={() => setRangeKey(r.key)}>{r.label}</Button>
          ))}
        </Box>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={q.loading} leftIcon={<RefreshCw className="w-4 h-4" />}>Làm mới</Button>
      </Box>

      {/* Cảnh báo ngưỡng 5xx */}
      {total5xx >= ALERT_5XX ? (
        <Card padding="md" backgroundClassName="bg-red-50 dark:bg-red-900/20" borderClassName="border border-red-200 dark:border-red-800">
          <Box layoutClassName="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <Typography size="sm" textClassName="text-red-700 dark:text-red-300">
              Cảnh báo: có <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-red-700 dark:text-red-300">{nf(total5xx)}</Typography> lỗi máy chủ (5xx) trong {range.label.toLowerCase()} — nên kiểm tra ngay.
            </Typography>
          </Box>
        </Card>
      ) : null}

      {/* KPI gọn */}
      <Box layoutClassName="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MiniStat label="Tổng lỗi" value={nf(totalErrors)} />
        <MiniStat label="Nhóm lỗi" value={nf(groups.length)} />
        <MiniStat label="Lỗi 5xx" value={nf(total5xx)} danger={total5xx > 0} />
      </Box>

      <Card padding="none">
        <Box layoutClassName="px-4 pt-4">
          <Heading level={5}>Nhóm lỗi theo endpoint</Heading>
          <Typography size="xs" variant="muted">Gom theo method + đường dẫn + status, sắp theo số lần.</Typography>
        </Box>
        {q.loading ? (
          <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
        ) : groups.length === 0 ? (
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="Không có lỗi trong kỳ này 🎉" />
        ) : (
          <Box layoutClassName="mt-2 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Method</TableHeaderCell>
                  <TableHeaderCell>Đường dẫn</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Số lần</TableHeaderCell>
                  <TableHeaderCell>Gần nhất</TableHeaderCell>
                  <TableHeaderCell>Lần đầu</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((g, i) => {
                  const c = statusBadgeClass(g.status);
                  const m = methodBadgeClass(g.method);
                  return (
                    <TableRow key={`${g.method}-${g.path}-${g.status}-${i}`}>
                      <TableCell><Badge size="sm" backgroundClassName={m.bg} textClassName={m.text} borderClassName="border-transparent">{g.method}</Badge></TableCell>
                      <TableCell textClassName="font-mono text-slate-600 dark:text-slate-400 max-w-md truncate">{g.path}</TableCell>
                      <TableCell><Badge size="sm" backgroundClassName={c.bg} textClassName={c.text} borderClassName="border-transparent">{g.status}</Badge></TableCell>
                      <TableCell textClassName="font-semibold text-slate-800 dark:text-slate-100">{nf(g.count)}</TableCell>
                      <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">{relTime(g.lastSeen)}</TableCell>
                      <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">{relTime(g.firstSeen)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
};

const MiniStat: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger }) => (
  <Card padding="md">
    <Box layoutClassName="flex items-center gap-3">
      <Box layoutClassName="w-10 h-10 flex items-center justify-center shrink-0" backgroundClassName={danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700/50'} roundedClassName="rounded-xl">
        <Bug className={`w-5 h-5 ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`} />
      </Box>
      <Box layoutClassName="min-w-0">
        <Typography size="xs" variant="muted" layoutClassName="truncate">{label}</Typography>
        <Heading level={4}>{value}</Heading>
      </Box>
    </Box>
  </Card>
);

export default ErrorGroupsTable;
