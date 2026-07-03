import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Clock, RefreshCw, Users, Gauge, HardDrive, Download, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useRequestLogStats, useRequestLogTimeseries } from '@/hooks/queries/useRequestLogsQuery';
import type { RequestLogStats } from '@/services/requestLogService';

type RangeKey = '24h' | '7d' | '30d';

const RANGES: { key: RangeKey; label: string; bucket: 'hour' | 'day'; ms: number }[] = [
  { key: '24h', label: '24 giờ', bucket: 'hour', ms: 24 * 3600 * 1000 },
  { key: '7d', label: '7 ngày', bucket: 'day', ms: 7 * 86400 * 1000 },
  { key: '30d', label: '30 ngày', bucket: 'day', ms: 30 * 86400 * 1000 },
];

const nf = (n: number) => n.toLocaleString('vi-VN');

const formatBytes = (b: number): string => {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
};

const tickLabel = (ts: string, bucket: 'hour' | 'day'): string => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return bucket === 'hour'
    ? `${String(d.getHours()).padStart(2, '0')}:00`
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** % thay đổi so kỳ trước (null nếu không so được). */
const delta = (cur: number, prev: number): number | null => {
  if (prev === 0) return cur === 0 ? 0 : null;
  return Math.round(((cur - prev) / prev) * 100);
};

interface TrafficDashboardProps {
  errorsOnly?: boolean;
}

const TrafficDashboard: React.FC<TrafficDashboardProps> = ({ errorsOnly = false }) => {
  const [rangeKey, setRangeKey] = useState<RangeKey>('7d');
  const [auto, setAuto] = useState(false);
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];

  const [nowMs, setNowMs] = useState(() => Date.now());
  // Auto-refresh: đẩy mốc thời gian mỗi 15s để query refetch.
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(id);
  }, [auto]);

  const { from, to, prevFrom, prevTo } = useMemo(
    () => ({
      from: new Date(nowMs - range.ms).toISOString(),
      to: new Date(nowMs).toISOString(),
      prevFrom: new Date(nowMs - 2 * range.ms).toISOString(),
      prevTo: new Date(nowMs - range.ms).toISOString(),
    }),
    [nowMs, range.ms],
  );

  const statsQuery = useRequestLogStats({ from, to, errorsOnly });
  const prevStatsQuery = useRequestLogStats({ from: prevFrom, to: prevTo, errorsOnly });
  const seriesQuery = useRequestLogTimeseries({ from, to, bucket: range.bucket, errorsOnly });

  const stats = statsQuery.data;
  const prev = prevStatsQuery.data;
  const series = seriesQuery.data ?? [];
  const loading = statsQuery.loading || seriesQuery.loading;

  const errorRate = stats && stats.total > 0 ? Math.round((stats.errorCount / stats.total) * 100) : 0;
  const prevErrorRate = prev && prev.total > 0 ? Math.round((prev.errorCount / prev.total) * 100) : 0;

  const chartData = useMemo(
    () => series.map((p) => ({ ...p, label: tickLabel(p.ts, range.bucket) })),
    [series, range.bucket],
  );

  const refresh = () => {
    setNowMs(Date.now());
    void statsQuery.refetch();
    void prevStatsQuery.refetch();
    void seriesQuery.refetch();
  };

  const exportCsv = () => {
    const rows = [['thoi_diem', 'requests', 'errors', 'unique_ips'], ...series.map((p) => [p.ts, String(p.requests), String(p.errors), String(p.uniqueIps)])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luu-luong-${rangeKey}${errorsOnly ? '-loi' : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box layoutClassName="space-y-4">
      {/* Thanh điều khiển */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <Button key={r.key} variant={r.key === rangeKey ? 'primary' : 'secondary'} size="sm" onClick={() => setRangeKey(r.key)}>
              {r.label}
            </Button>
          ))}
        </Box>
        <Box layoutClassName="flex items-center gap-3">
          <Box layoutClassName="flex items-center gap-1.5">
            <Switch checked={auto} onCheckedChange={setAuto} />
            <Typography as="span" size="xs" variant="muted">Tự làm mới</Typography>
          </Box>
          <Button variant="ghost" size="sm" onClick={exportCsv} disabled={series.length === 0} leftIcon={<Download className="w-4 h-4" />}>CSV</Button>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>Làm mới</Button>
        </Box>
      </Box>

      {/* KPI có so kỳ trước */}
      <Box layoutClassName="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-5 h-5 text-primary-600 dark:text-primary-500" />} label={errorsOnly ? 'Request lỗi' : 'Tổng request'} value={stats ? nf(stats.total) : '—'} deltaPct={stats && prev ? delta(stats.total, prev.total) : null} />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />} label="Khách (IP)" value={stats ? nf(stats.uniqueIps) : '—'} deltaPct={stats && prev ? delta(stats.uniqueIps, prev.uniqueIps) : null} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />} label="Tỉ lệ lỗi" value={stats ? `${nf(stats.errorCount)} · ${errorRate}%` : '—'} deltaPct={stats && prev ? delta(errorRate, prevErrorRate) : null} invert />
        <StatCard icon={<Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} label="Độ trễ p95" value={stats ? `${nf(stats.p95)} ms` : '—'} deltaPct={stats && prev ? delta(stats.p95, prev.p95) : null} invert />
      </Box>

      {/* Dải latency percentiles + bandwidth */}
      {stats ? (
        <Card padding="md">
          <Box layoutClassName="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Metric icon={<Clock className="w-4 h-4 text-slate-400" />} label="p50" value={`${nf(stats.p50)} ms`} />
            <Metric label="p90" value={`${nf(stats.p90)} ms`} />
            <Metric label="p95" value={`${nf(stats.p95)} ms`} />
            <Metric label="p99" value={`${nf(stats.p99)} ms`} />
            <Metric label="TB" value={`${nf(stats.avgDuration)} ms`} />
            <Metric icon={<HardDrive className="w-4 h-4 text-slate-400" />} label="Băng thông" value={formatBytes(stats.bandwidth)} />
            {!errorsOnly ? <Metric icon={<Users className="w-4 h-4 text-slate-400" />} label="Người dùng đăng nhập" value={nf(stats.uniqueUsers)} /> : null}
          </Box>
        </Card>
      ) : null}

      {/* Biểu đồ */}
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
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: number, name: string) => [nf(v), name === 'requests' ? 'Request' : name === 'errors' ? 'Lỗi' : 'Khách']} />
                {!errorsOnly && <Area type="monotone" dataKey="requests" stroke="#14b8a6" strokeWidth={2} fill="url(#gReq)" />}
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#gErr)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Card>

      {/* Phân bố status + method + thiết bị/trình duyệt/OS */}
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
            <Heading level={5} layoutClassName="mb-2 mt-4">Theo method</Heading>
            <Box layoutClassName="flex flex-wrap gap-2">
              {stats.methodBuckets.length === 0 ? <Typography size="sm" variant="muted">—</Typography> : stats.methodBuckets.map((m) => (
                <Badge key={m.method} size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{m.method}: {nf(m.count)}</Badge>
              ))}
            </Box>
          </Card>
          <Card padding="md">
            <Heading level={5} layoutClassName="mb-3">Thiết bị / Trình duyệt / Hệ điều hành</Heading>
            <Box layoutClassName="space-y-3">
              <ChipRow title="Thiết bị" items={stats.deviceBuckets} />
              <ChipRow title="Trình duyệt" items={stats.browserBuckets} />
              <ChipRow title="OS" items={stats.osBuckets} />
            </Box>
          </Card>
        </Box>
      ) : null}

      {/* Các bảng top */}
      <Box layoutClassName="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList title={errorsOnly ? 'Top tài nguyên lỗi' : 'Top tài nguyên'} rows={(stats?.topPaths ?? []).map((p) => ({ label: p.path, count: p.count }))} loading={loading} />
        <TopList title="Endpoint chậm nhất (p95)" rows={(stats?.slowestPaths ?? []).map((p) => ({ label: p.path, sub: `${nf(p.p95)} ms · ${p.count} req`, count: p.p95 }))} loading={loading} unit="ms" />
        <TopList title="Top khách (IP)" rows={(stats?.topIps ?? []).map((i) => ({ label: i.ip, sub: i.country ?? undefined, count: i.count }))} loading={loading} />
        {!errorsOnly ? <TopList title="Quốc gia" rows={(stats?.topCountries ?? []).map((c) => ({ label: c.country, count: c.count }))} loading={loading} /> : null}
        {!errorsOnly ? <TopList title="Nguồn (referrer)" rows={(stats?.topReferers ?? []).map((r) => ({ label: r.referer, count: r.count }))} loading={loading} /> : null}
        {!errorsOnly ? <TopList title="Người dùng nhiều request" rows={(stats?.topUsers ?? []).map((u) => ({ label: u.user, count: u.count }))} loading={loading} /> : null}
      </Box>
    </Box>
  );
};

const DeltaChip: React.FC<{ pct: number | null; invert?: boolean }> = ({ pct, invert }) => {
  if (pct === null) return <Typography as="span" size="xs" variant="muted">—</Typography>;
  if (pct === 0) return (
    <Box layoutClassName="inline-flex items-center gap-0.5"><Minus className="w-3 h-3 text-slate-400" /><Typography as="span" size="xs" variant="muted">0%</Typography></Box>
  );
  const up = pct > 0;
  const good = invert ? !up : up;
  const cls = good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  return (
    <Box layoutClassName="inline-flex items-center gap-0.5">
      {up ? <ArrowUp className={`w-3 h-3 ${cls}`} /> : <ArrowDown className={`w-3 h-3 ${cls}`} />}
      <Typography as="span" size="xs" layoutClassName="font-medium" textClassName={cls}>{Math.abs(pct)}%</Typography>
    </Box>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; deltaPct?: number | null; invert?: boolean }> = ({ icon, label, value, deltaPct, invert }) => (
  <Card padding="md">
    <Box layoutClassName="flex items-center gap-3">
      <Box layoutClassName="w-10 h-10 flex items-center justify-center shrink-0" backgroundClassName="bg-slate-100 dark:bg-slate-700/50" roundedClassName="rounded-xl">{icon}</Box>
      <Box layoutClassName="min-w-0">
        <Box layoutClassName="flex items-center gap-2">
          <Typography size="xs" variant="muted" layoutClassName="truncate">{label}</Typography>
          {deltaPct !== undefined ? <DeltaChip pct={deltaPct} invert={invert} /> : null}
        </Box>
        <Heading level={4}>{value}</Heading>
      </Box>
    </Box>
  </Card>
);

const Metric: React.FC<{ icon?: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box layoutClassName="flex items-center gap-1.5">
    {icon}
    <Typography as="span" size="xs" variant="muted">{label}</Typography>
    <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">{value}</Typography>
  </Box>
);

const StatusChip: React.FC<{ label: string; count: number; bg: string; text: string }> = ({ label, count, bg, text }) => (
  <Box layoutClassName="flex items-center gap-1.5 rounded-lg px-3 py-1.5" backgroundClassName={bg}>
    <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName={text}>{label}</Typography>
    <Typography as="span" size="sm" layoutClassName="font-bold" textClassName={text}>{nf(count)}</Typography>
  </Box>
);

const ChipRow: React.FC<{ title: string; items: { name: string; count: number }[] }> = ({ title, items }) => (
  <Box layoutClassName="space-y-1">
    <Typography size="xs" variant="muted">{title}</Typography>
    <Box layoutClassName="flex flex-wrap gap-1.5">
      {items.length === 0 ? <Typography size="sm" variant="muted">—</Typography> : items.map((it) => (
        <Badge key={it.name} size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{it.name}: {nf(it.count)}</Badge>
      ))}
    </Box>
  </Box>
);

const TopList: React.FC<{ title: string; rows: { label: string; sub?: string; count: number }[]; loading: boolean; unit?: string }> = ({ title, rows, loading, unit }) => {
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
                <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate font-mono" textClassName="text-slate-600 dark:text-slate-300">{r.label}{r.sub ? ` · ${r.sub}` : ''}</Typography>
                <Typography as="span" size="xs" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-700 dark:text-slate-200">{nf(r.count)}{unit ? ` ${unit}` : ''}</Typography>
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
