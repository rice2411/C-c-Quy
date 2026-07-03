import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Globe, Clock, RefreshCw, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useRequestLogStats, useRequestLogTimeseries } from '@/hooks/queries/useRequestLogsQuery';

type RangeKey = '24h' | '7d' | '30d';

const RANGES: { key: RangeKey; label: string; bucket: 'hour' | 'day'; ms: number }[] = [
  { key: '24h', label: '24 giờ', bucket: 'hour', ms: 24 * 3600 * 1000 },
  { key: '7d', label: '7 ngày', bucket: 'day', ms: 7 * 86400 * 1000 },
  { key: '30d', label: '30 ngày', bucket: 'day', ms: 30 * 86400 * 1000 },
];

const nf = (n: number) => n.toLocaleString('vi-VN');

/** Nhãn trục X: giờ → HH:00, ngày → dd/mm. */
const tickLabel = (ts: string, bucket: 'hour' | 'day'): string => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return bucket === 'hour'
    ? `${String(d.getHours()).padStart(2, '0')}:00`
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

interface TrafficDashboardProps {
  /** true → chỉ tính request lỗi (status ≥ 400). */
  errorsOnly?: boolean;
}

const TrafficDashboard: React.FC<TrafficDashboardProps> = ({ errorsOnly = false }) => {
  const [rangeKey, setRangeKey] = useState<RangeKey>('7d');
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];

  // Mốc thời gian tính 1 lần theo range (không phụ thuộc render — dùng state khởi tạo lười).
  const [nowMs] = useState(() => Date.now());
  const { from, to } = useMemo(
    () => ({ from: new Date(nowMs - range.ms).toISOString(), to: new Date(nowMs).toISOString() }),
    [nowMs, range.ms],
  );

  const statsQuery = useRequestLogStats({ from, to, errorsOnly });
  const seriesQuery = useRequestLogTimeseries({ from, to, bucket: range.bucket, errorsOnly });

  const stats = statsQuery.data;
  const series = seriesQuery.data ?? [];
  const loading = statsQuery.loading || seriesQuery.loading;

  const errorRate = stats && stats.total > 0 ? Math.round((stats.errorCount / stats.total) * 100) : 0;

  const chartData = useMemo(
    () => series.map((p) => ({ ...p, label: tickLabel(p.ts, range.bucket) })),
    [series, range.bucket],
  );

  const refresh = () => {
    void statsQuery.refetch();
    void seriesQuery.refetch();
  };

  return (
    <Box layoutClassName="space-y-4">
      {/* Chọn khoảng thời gian */}
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              variant={r.key === rangeKey ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRangeKey(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </Box>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Làm mới
        </Button>
      </Box>

      {/* KPI */}
      <Box layoutClassName="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5 text-primary-600 dark:text-primary-500" />}
          label={errorsOnly ? 'Request lỗi' : 'Tổng request'}
          value={stats ? nf(stats.total) : '—'}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Khách (IP duy nhất)"
          value={stats ? nf(stats.uniqueIps) : '—'}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          label="Lỗi (≥400)"
          value={stats ? `${nf(stats.errorCount)} · ${errorRate}%` : '—'}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Phản hồi TB"
          value={stats ? `${nf(stats.avgDuration)} ms` : '—'}
        />
      </Box>

      {/* Biểu đồ theo thời gian */}
      <Card padding="md">
        <Heading level={5} layoutClassName="mb-3">{errorsOnly ? 'Lỗi theo thời gian' : 'Lưu lượng theo thời gian'}</Heading>
        {loading ? (
          <Box layoutClassName="flex items-center justify-center h-64"><Spinner size="lg" /></Box>
        ) : chartData.length === 0 ? (
          <EmptyState icon={<Activity className="h-6 w-6" />} title="Chưa có dữ liệu trong kỳ này." />
        ) : (
          <Box layoutClassName="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number, name: string) => [nf(v), name === 'requests' ? 'Request' : name === 'errors' ? 'Lỗi' : 'Khách']}
                />
                {!errorsOnly && (
                  <Area type="monotone" dataKey="requests" stroke="#14b8a6" strokeWidth={2} fill="url(#gReq)" />
                )}
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#gErr)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Card>

      {/* Phân bố status + method */}
      {!errorsOnly && stats ? (
        <Box layoutClassName="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card padding="md">
            <Heading level={5} layoutClassName="mb-3">Phân bố status code</Heading>
            <Box layoutClassName="flex flex-wrap gap-2">
              <StatusChip label="2xx" count={stats.statusBuckets.s2xx} bg="bg-green-100 dark:bg-green-900/30" text="text-green-700 dark:text-green-300" />
              <StatusChip label="3xx" count={stats.statusBuckets.s3xx} bg="bg-blue-100 dark:bg-blue-900/30" text="text-blue-700 dark:text-blue-300" />
              <StatusChip label="4xx" count={stats.statusBuckets.s4xx} bg="bg-amber-100 dark:bg-amber-900/30" text="text-amber-700 dark:text-amber-300" />
              <StatusChip label="5xx" count={stats.statusBuckets.s5xx} bg="bg-red-100 dark:bg-red-900/30" text="text-red-700 dark:text-red-300" />
            </Box>
          </Card>
          <Card padding="md">
            <Heading level={5} layoutClassName="mb-3">Theo method</Heading>
            <Box layoutClassName="flex flex-wrap gap-2">
              {stats.methodBuckets.length === 0 ? (
                <Typography size="sm" variant="muted">—</Typography>
              ) : (
                stats.methodBuckets.map((m) => (
                  <Badge key={m.method} size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">
                    {m.method}: {nf(m.count)}
                  </Badge>
                ))
              )}
            </Box>
          </Card>
        </Box>
      ) : null}

      {/* Top path + top IP */}
      <Box layoutClassName="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList
          title={errorsOnly ? 'Top tài nguyên lỗi' : 'Top tài nguyên'}
          rows={(stats?.topPaths ?? []).map((p) => ({ label: p.path, count: p.count }))}
          loading={loading}
        />
        <TopList
          title="Top khách (IP)"
          rows={(stats?.topIps ?? []).map((i) => ({ label: i.ip, sub: i.country ?? undefined, count: i.count }))}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card padding="md">
    <Box layoutClassName="flex items-center gap-3">
      <Box layoutClassName="w-10 h-10 flex items-center justify-center shrink-0" backgroundClassName="bg-slate-100 dark:bg-slate-700/50" roundedClassName="rounded-xl">
        {icon}
      </Box>
      <Box layoutClassName="min-w-0">
        <Typography size="xs" variant="muted" layoutClassName="truncate">{label}</Typography>
        <Heading level={4}>{value}</Heading>
      </Box>
    </Box>
  </Card>
);

const StatusChip: React.FC<{ label: string; count: number; bg: string; text: string }> = ({ label, count, bg, text }) => (
  <Box layoutClassName="flex items-center gap-1.5 rounded-lg px-3 py-1.5" backgroundClassName={bg}>
    <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName={text}>{label}</Typography>
    <Typography as="span" size="sm" layoutClassName="font-bold" textClassName={text}>{nf(count)}</Typography>
  </Box>
);

const TopList: React.FC<{
  title: string;
  rows: { label: string; sub?: string; count: number }[];
  loading: boolean;
}> = ({ title, rows, loading }) => {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <Card padding="md">
      <Heading level={5} layoutClassName="mb-3">{title}</Heading>
      {loading ? (
        <Box layoutClassName="flex items-center justify-center py-8"><Spinner /></Box>
      ) : rows.length === 0 ? (
        <Typography size="sm" variant="muted">Chưa có dữ liệu.</Typography>
      ) : (
        <Box layoutClassName="space-y-2">
          {rows.map((r, i) => (
            <Box key={`${r.label}-${i}`} layoutClassName="space-y-1">
              <Box layoutClassName="flex items-center justify-between gap-2">
                <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate font-mono" textClassName="text-slate-600 dark:text-slate-300">
                  {r.label}{r.sub ? ` · ${r.sub}` : ''}
                </Typography>
                <Typography as="span" size="xs" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-700 dark:text-slate-200">{nf(r.count)}</Typography>
              </Box>
              <Box layoutClassName="h-1.5 w-full overflow-hidden rounded-full" backgroundClassName="bg-slate-100 dark:bg-slate-700">
                <Box layoutClassName="h-full rounded-full" backgroundClassName="bg-primary-500" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};

export default TrafficDashboard;
