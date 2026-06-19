import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe,
  Inbox,
  RefreshCw,
  Search,
} from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  fetchRequestLogs,
  fetchRequestLogStats,
  RequestLog,
  RequestLogQuery,
  RequestLogStats,
} from '@/services/requestLogService';

const PAGE_SIZE = 50;

type Filters = {
  from: string;
  to: string;
  method: string;
  status: string;
  ip: string;
  email: string;
  path: string; // lọc phía client trên trang hiện tại
};

const emptyFilters: Filters = {
  from: '',
  to: '',
  method: '',
  status: '',
  ip: '',
  email: '',
  path: '',
};

/** Màu badge theo nhóm status code. */
const statusBadgeClass = (status: number): { bg: string; text: string } => {
  if (status >= 500) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
  if (status >= 400) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
  if (status >= 300) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
  return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' };
};

/** Màu badge theo HTTP method. */
const methodBadgeClass = (method: string): { bg: string; text: string } => {
  switch (method.toUpperCase()) {
    case 'GET':
      return { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' };
    case 'POST':
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'PATCH':
    case 'PUT':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
    case 'DELETE':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
    default:
      return { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300' };
  }
};

const formatTime = (log: RequestLog): string => {
  try {
    return log.timestamp.toDate().toLocaleString('vi-VN');
  } catch {
    return '—';
  }
};

const formatGeo = (log: RequestLog): string => {
  if (!log.geo) return '—';
  const parts = [log.geo.city, log.geo.region, log.geo.country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

/** Phân loại IP để đánh dấu localhost / mạng nội bộ (geoip không tra được). */
const classifyIp = (ip: string): 'localhost' | 'private' | 'public' => {
  if (!ip || ip === '::1' || ip === 'localhost' || /^127\./.test(ip)) return 'localhost';
  if (
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^(fc|fd|fe80)/i.test(ip)
  ) {
    return 'private';
  }
  return 'public';
};

/** Nhãn vị trí dạng chuỗi (mobile + chi tiết). */
const formatLocation = (log: RequestLog): string => {
  const kind = classifyIp(log.ip);
  if (kind === 'localhost') return 'Localhost';
  if (kind === 'private') return 'Mạng nội bộ';
  return formatGeo(log);
};

/** Ô vị trí desktop: badge cho localhost/nội bộ, text cho IP công khai. */
const LocationCell: React.FC<{ log: RequestLog }> = ({ log }) => {
  const kind = classifyIp(log.ip);
  if (kind === 'localhost') {
    return (
      <Badge
        size="sm"
        backgroundClassName="bg-slate-100 dark:bg-slate-700/50"
        textClassName="text-slate-500 dark:text-slate-400"
        borderClassName="border-transparent"
      >
        Localhost
      </Badge>
    );
  }
  if (kind === 'private') {
    return (
      <Badge
        size="sm"
        backgroundClassName="bg-violet-100 dark:bg-violet-900/30"
        textClassName="text-violet-700 dark:text-violet-300"
        borderClassName="border-transparent"
      >
        Mạng nội bộ
      </Badge>
    );
  }
  return <>{formatGeo(log)}</>;
};

const RequestLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<RequestLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const buildQuery = useCallback(
    (f: Filters, p: number): RequestLogQuery => ({
      from: f.from ? new Date(f.from).toISOString() : undefined,
      to: f.to ? new Date(f.to).toISOString() : undefined,
      method: f.method || undefined,
      status: f.status ? Number(f.status) : undefined,
      ip: f.ip || undefined,
      email: f.email || undefined,
      page: p,
      limit: PAGE_SIZE,
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(applied, page);
      const [logsRes, statsRes] = await Promise.all([
        fetchRequestLogs(query),
        page === 1
          ? fetchRequestLogStats({ from: query.from, to: query.to })
          : Promise.resolve(null),
      ]);
      setLogs(logsRes.items);
      setHasMore(logsRes.hasMore);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được nhật ký');
    } finally {
      setLoading(false);
    }
  }, [applied, page, buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = () => {
    setPage(1);
    setApplied(filters);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  };

  // Lọc path phía client trên trang hiện tại (BE không hỗ trợ tìm chuỗi con).
  const visibleLogs = useMemo(() => {
    const term = applied.path.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) => l.path.toLowerCase().includes(term));
  }, [logs, applied.path]);

  return (
    <Box layoutClassName="space-y-6">
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box>
          <Heading level={2}>Nhật ký Request</Heading>
          <Typography variant="muted" size="sm">
            Theo dõi IP, vị trí, người dùng và tài nguyên được truy cập trên hệ thống.
          </Typography>
        </Box>
        <Button
          variant="secondary"
          onClick={load}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {/* Thống kê tổng quan */}
      <Box layoutClassName="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5 text-primary-600 dark:text-primary-500" />}
          label="Tổng request"
          value={stats ? stats.total.toLocaleString('vi-VN') : '—'}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          label="Request lỗi (≥400)"
          value={stats ? stats.errorCount.toLocaleString('vi-VN') : '—'}
        />
        <StatCard
          icon={<Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="IP duy nhất"
          value={stats ? stats.uniqueIps.toLocaleString('vi-VN') : '—'}
        />
        <StatCard
          icon={<Search className="w-5 h-5 text-slate-500" />}
          label="Số dòng đã quét"
          value={stats ? stats.scanned.toLocaleString('vi-VN') : '—'}
        />
      </Box>

      {/* Bộ lọc */}
      <Card padding="md">
        <Box layoutClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterField label="Từ thời điểm">
            <Input
              type="datetime-local"
              fullWidth
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </FilterField>
          <FilterField label="Đến thời điểm">
            <Input
              type="datetime-local"
              fullWidth
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </FilterField>
          <FilterField label="Method">
            <Select
              fullWidth
              value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </Select>
          </FilterField>
          <FilterField label="Status code">
            <Input
              type="number"
              fullWidth
              placeholder="vd 200, 401"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            />
          </FilterField>
          <FilterField label="IP">
            <Input
              fullWidth
              placeholder="vd 14.161.x.x"
              value={filters.ip}
              onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
            />
          </FilterField>
          <FilterField label="Email người dùng">
            <Input
              fullWidth
              placeholder="email@..."
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
          </FilterField>
          <FilterField label="Tài nguyên (path, trên trang)">
            <Input
              fullWidth
              placeholder="vd /api/orders"
              value={filters.path}
              onChange={(e) => setFilters({ ...filters, path: e.target.value })}
            />
          </FilterField>
          <Box layoutClassName="flex items-end gap-2">
            <Button onClick={handleApply} leftIcon={<Search className="w-4 h-4" />} disabled={loading}>
              Tìm
            </Button>
            <Button variant="secondary" onClick={handleReset} disabled={loading}>
              Xoá lọc
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Bảng log */}
      <Card padding="none">
        {loading ? (
          <Box layoutClassName="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </Box>
        ) : error ? (
          <Box layoutClassName="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <Typography textClassName="text-red-600 dark:text-red-400">{error}</Typography>
          </Box>
        ) : visibleLogs.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="Không có request nào khớp bộ lọc."
          />
        ) : (
          <>
            {/* Desktop */}
            <Box layoutClassName="hidden md:block overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Thời gian</TableHeaderCell>
                    <TableHeaderCell>IP</TableHeaderCell>
                    <TableHeaderCell>Vị trí</TableHeaderCell>
                    <TableHeaderCell>Người dùng</TableHeaderCell>
                    <TableHeaderCell>Method</TableHeaderCell>
                    <TableHeaderCell>Tài nguyên</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Thời lượng</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleLogs.map((log) => {
                    const c = statusBadgeClass(log.statusCode);
                    const m = methodBadgeClass(log.method);
                    const expanded = expandedId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                      <TableRow
                        onClick={() => toggleExpand(log.id)}
                        stateClassName="cursor-pointer"
                        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatTime(log)}
                        </TableCell>
                        <TableCell textClassName="font-mono text-slate-700 dark:text-slate-300">
                          {log.ip || '—'}
                        </TableCell>
                        <TableCell textClassName="text-slate-600 dark:text-slate-400">
                          <LocationCell log={log} />
                        </TableCell>
                        <TableCell textClassName="text-slate-700 dark:text-slate-300">
                          {log.email || log.uid || '—'}
                          {log.role ? (
                            <Typography as="span" size="xs" variant="muted" layoutClassName="ml-1">
                              ({log.role})
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge backgroundClassName={m.bg} textClassName={m.text} borderClassName="border-transparent">
                            {log.method}
                          </Badge>
                        </TableCell>
                        <TableCell textClassName="font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {log.path}
                        </TableCell>
                        <TableCell>
                          <Badge backgroundClassName={c.bg} textClassName={c.text} borderClassName="border-transparent">
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {log.durationMs} ms
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={8} layoutClassName="bg-slate-50 dark:bg-slate-800/40">
                            <LogDetail log={log} />
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile */}
            <Box layoutClassName="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
              {visibleLogs.map((log) => {
                const c = statusBadgeClass(log.statusCode);
                const m = methodBadgeClass(log.method);
                const expanded = expandedId === log.id;
                return (
                  <Box
                    key={log.id}
                    onClick={() => toggleExpand(log.id)}
                    layoutClassName="p-4 space-y-1"
                    stateClassName="cursor-pointer"
                  >
                    <Box layoutClassName="flex items-center justify-between gap-2">
                      <Box layoutClassName="flex items-center gap-2 min-w-0">
                        <Badge size="sm" backgroundClassName={m.bg} textClassName={m.text} borderClassName="border-transparent">
                          {log.method}
                        </Badge>
                        <Typography as="span" size="xs" layoutClassName="truncate" textClassName="font-mono text-slate-500 dark:text-slate-400">
                          {log.path}
                        </Typography>
                      </Box>
                      <Badge backgroundClassName={c.bg} textClassName={c.text} borderClassName="border-transparent">
                        {log.statusCode}
                      </Badge>
                    </Box>
                    <Typography size="xs" variant="muted">
                      {formatTime(log)} · {log.durationMs} ms
                    </Typography>
                    <Typography size="xs" variant="muted">
                      <Typography as="span" size="xs" textClassName="font-mono">
                        {log.ip || '—'}
                      </Typography>{' '}
                      · {formatLocation(log)}
                    </Typography>
                    <Typography size="xs" variant="muted">
                      {log.email || log.uid || 'Ẩn danh'}
                      {log.role ? ` (${log.role})` : ''}
                    </Typography>
                    {expanded && (
                      <Box layoutClassName="pt-2 mt-1" borderClassName="border-t border-slate-100 dark:border-slate-700">
                        <LogDetail log={log} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Card>

      {/* Phân trang */}
      {!loading && !error && (
        <Box layoutClassName="flex items-center justify-between">
          <Typography size="sm" variant="muted">
            Trang {page}
            {applied.path ? ' · đang lọc path trên trang này' : ''}
          </Typography>
          <Box layoutClassName="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({
  label,
  children,
  mono,
}) => (
  <Box layoutClassName="grid grid-cols-[120px_1fr] gap-2 py-1">
    <Typography as="span" size="xs" variant="muted" layoutClassName="shrink-0">
      {label}
    </Typography>
    <Typography
      as="span"
      size="xs"
      textClassName={`text-slate-700 dark:text-slate-300 break-all ${mono ? 'font-mono' : ''}`}
      layoutClassName="whitespace-pre-wrap"
    >
      {children}
    </Typography>
  </Box>
);

const LogDetail: React.FC<{ log: RequestLog }> = ({ log }) => {
  const geo = log.geo
    ? [
        [log.geo.city, log.geo.region, log.geo.country].filter(Boolean).join(', '),
        log.geo.lat != null && log.geo.lng != null ? `(${log.geo.lat}, ${log.geo.lng})` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '—';
  const kind = classifyIp(log.ip);
  const geoText = kind === 'localhost' ? 'Localhost' : kind === 'private' ? 'Mạng nội bộ' : geo;
  return (
    <Box layoutClassName="py-2 space-y-0.5">
      <DetailRow label="Thời gian" mono>
        {(() => {
          try {
            return log.timestamp.toDate().toISOString();
          } catch {
            return '—';
          }
        })()}
      </DetailRow>
      <DetailRow label="URL đầy đủ" mono>
        {log.method} {log.path}
        {log.query || ''}
      </DetailRow>
      <DetailRow label="Status" mono>
        {log.statusCode} · {log.durationMs} ms
        {log.responseSize != null ? ` · ${log.responseSize} bytes` : ''}
      </DetailRow>
      <DetailRow label="IP" mono>
        {log.ip || '—'}
      </DetailRow>
      <DetailRow label="Vị trí">{geoText}</DetailRow>
      <DetailRow label="Người dùng">
        {log.email || log.uid || 'Ẩn danh'}
        {log.role ? ` (${log.role})` : ''}
        {log.uid && log.email ? ` · uid: ${log.uid}` : ''}
      </DetailRow>
      <DetailRow label="User-Agent" mono>
        {log.userAgent || '—'}
      </DetailRow>
      <DetailRow label="Referer" mono>
        {log.referer || '—'}
      </DetailRow>
      <DetailRow label="Payload" mono>
        {log.body ? log.body : <Typography as="span" size="xs" variant="muted">— (không có / không phải method có body)</Typography>}
      </DetailRow>
      {log.body ? (
        <Typography size="xs" variant="muted" layoutClassName="pt-1">
          * Các trường nhạy cảm (mật khẩu, token...) đã được che.
        </Typography>
      ) : null}
    </Box>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <Card padding="md">
    <Box layoutClassName="flex items-center gap-3">
      <Box
        layoutClassName="w-10 h-10 flex items-center justify-center shrink-0"
        backgroundClassName="bg-slate-100 dark:bg-slate-700/50"
        roundedClassName="rounded-xl"
      >
        {icon}
      </Box>
      <Box layoutClassName="min-w-0">
        <Typography size="xs" variant="muted" layoutClassName="truncate">
          {label}
        </Typography>
        <Heading level={4}>{value}</Heading>
      </Box>
    </Box>
  </Card>
);

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box layoutClassName="space-y-1">
    <Typography size="xs" variant="muted">
      {label}
    </Typography>
    {children}
  </Box>
);

export default RequestLogsPage;
