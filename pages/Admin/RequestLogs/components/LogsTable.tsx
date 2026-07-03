import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RefreshCw, Search } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
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
import { RequestLog, RequestLogQuery } from '@/services/requestLogService';
import { useRequestLogs } from '@/hooks/queries/useRequestLogsQuery';
import { statusBadgeClass, methodBadgeClass, formatTime, formatLocation, classifyIp, LocationCell } from './logFormat';

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

const emptyFilters: Filters = { from: '', to: '', method: '', status: '', ip: '', email: '', path: '' };

const LogsTable: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
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

  const query = useMemo(() => buildQuery(applied, page), [buildQuery, applied, page]);
  const logsQuery = useRequestLogs(query);

  const logs = logsQuery.data?.items ?? [];
  const hasMore = logsQuery.data?.hasMore ?? false;
  const loading = logsQuery.loading || logsQuery.fetching;
  const error = logsQuery.error ? logsQuery.error.message || 'Không tải được nhật ký' : null;

  const handleApply = () => {
    setPage(1);
    setApplied(filters);
  };
  const handleReset = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  };

  const visibleLogs = useMemo(() => {
    const term = applied.path.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) => l.path.toLowerCase().includes(term));
  }, [logs, applied.path]);

  return (
    <Box layoutClassName="space-y-4">
      {/* Bộ lọc */}
      <Card padding="md">
        <Box layoutClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterField label="Từ thời điểm">
            <Input type="datetime-local" fullWidth value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </FilterField>
          <FilterField label="Đến thời điểm">
            <Input type="datetime-local" fullWidth value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </FilterField>
          <FilterField label="Method">
            <Select fullWidth value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
              <option value="">Tất cả</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </Select>
          </FilterField>
          <FilterField label="Status code">
            <Input type="number" fullWidth placeholder="vd 200, 401" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} />
          </FilterField>
          <FilterField label="IP">
            <Input fullWidth placeholder="vd 14.161.x.x" value={filters.ip} onChange={(e) => setFilters({ ...filters, ip: e.target.value })} />
          </FilterField>
          <FilterField label="Email người dùng">
            <Input fullWidth placeholder="email@..." value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
          </FilterField>
          <FilterField label="Tài nguyên (path, trên trang)">
            <Input fullWidth placeholder="vd /api/orders" value={filters.path} onChange={(e) => setFilters({ ...filters, path: e.target.value })} />
          </FilterField>
          <Box layoutClassName="flex items-end gap-2">
            <Button onClick={handleApply} leftIcon={<Search className="w-4 h-4" />} disabled={loading}>Tìm</Button>
            <Button variant="secondary" onClick={handleReset} disabled={loading}>Xoá lọc</Button>
            <Button variant="ghost" onClick={() => void logsQuery.refetch()} disabled={loading} leftIcon={<RefreshCw className="w-4 h-4" />} aria-label="Làm mới">Làm mới</Button>
          </Box>
        </Box>
      </Card>

      {/* Bảng log */}
      <Card padding="none">
        {loading ? (
          <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
        ) : error ? (
          <Box layoutClassName="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <Typography textClassName="text-red-600 dark:text-red-400">{error}</Typography>
          </Box>
        ) : visibleLogs.length === 0 ? (
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="Không có request nào khớp bộ lọc." />
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
                        <TableRow onClick={() => toggleExpand(log.id)} stateClassName="cursor-pointer" hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatTime(log)}</TableCell>
                          <TableCell textClassName="font-mono text-slate-700 dark:text-slate-300">{log.ip || '—'}</TableCell>
                          <TableCell textClassName="text-slate-600 dark:text-slate-400"><LocationCell log={log} /></TableCell>
                          <TableCell textClassName="text-slate-700 dark:text-slate-300">
                            {log.email || log.uid || '—'}
                            {log.role ? <Typography as="span" size="xs" variant="muted" layoutClassName="ml-1">({log.role})</Typography> : null}
                          </TableCell>
                          <TableCell>
                            <Badge backgroundClassName={m.bg} textClassName={m.text} borderClassName="border-transparent">{log.method}</Badge>
                          </TableCell>
                          <TableCell textClassName="font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.path}</TableCell>
                          <TableCell>
                            <Badge backgroundClassName={c.bg} textClassName={c.text} borderClassName="border-transparent">{log.statusCode}</Badge>
                          </TableCell>
                          <TableCell textClassName="text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.durationMs} ms</TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow>
                            <TableCell colSpan={8} layoutClassName="bg-slate-50 dark:bg-slate-800/40"><LogDetail log={log} /></TableCell>
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
                  <Box key={log.id} onClick={() => toggleExpand(log.id)} layoutClassName="p-4 space-y-1" stateClassName="cursor-pointer">
                    <Box layoutClassName="flex items-center justify-between gap-2">
                      <Box layoutClassName="flex items-center gap-2 min-w-0">
                        <Badge size="sm" backgroundClassName={m.bg} textClassName={m.text} borderClassName="border-transparent">{log.method}</Badge>
                        <Typography as="span" size="xs" layoutClassName="truncate" textClassName="font-mono text-slate-500 dark:text-slate-400">{log.path}</Typography>
                      </Box>
                      <Badge backgroundClassName={c.bg} textClassName={c.text} borderClassName="border-transparent">{log.statusCode}</Badge>
                    </Box>
                    <Typography size="xs" variant="muted">{formatTime(log)} · {log.durationMs} ms</Typography>
                    <Typography size="xs" variant="muted">
                      <Typography as="span" size="xs" textClassName="font-mono">{log.ip || '—'}</Typography> · {formatLocation(log)}
                    </Typography>
                    <Typography size="xs" variant="muted">{log.email || log.uid || 'Ẩn danh'}{log.role ? ` (${log.role})` : ''}</Typography>
                    {expanded && (
                      <Box layoutClassName="pt-2 mt-1" borderClassName="border-t border-slate-100 dark:border-slate-700"><LogDetail log={log} /></Box>
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
          <Typography size="sm" variant="muted">Trang {page}{applied.path ? ' · đang lọc path trên trang này' : ''}</Typography>
          <Box layoutClassName="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>Trước</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>Sau<ChevronRight className="w-4 h-4" /></Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({ label, children, mono }) => (
  <Box layoutClassName="grid grid-cols-[120px_1fr] gap-2 py-1">
    <Typography as="span" size="xs" variant="muted" layoutClassName="shrink-0">{label}</Typography>
    <Typography as="span" size="xs" textClassName={`text-slate-700 dark:text-slate-300 break-all ${mono ? 'font-mono' : ''}`} layoutClassName="whitespace-pre-wrap">{children}</Typography>
  </Box>
);

const LogDetail: React.FC<{ log: RequestLog }> = ({ log }) => {
  const geo = log.geo
    ? [
        [log.geo.city, log.geo.region, log.geo.country].filter(Boolean).join(', '),
        log.geo.lat != null && log.geo.lng != null ? `(${log.geo.lat}, ${log.geo.lng})` : '',
      ].filter(Boolean).join(' ')
    : '—';
  const kind = classifyIp(log.ip);
  const geoText = kind === 'localhost' ? 'Localhost' : kind === 'private' ? 'Mạng nội bộ' : geo;
  return (
    <Box layoutClassName="py-2 space-y-0.5">
      <DetailRow label="Thời gian" mono>
        {(() => { try { return log.timestamp.toDate().toISOString(); } catch { return '—'; } })()}
      </DetailRow>
      <DetailRow label="URL đầy đủ" mono>{log.method} {log.path}{log.query || ''}</DetailRow>
      <DetailRow label="Status" mono>{log.statusCode} · {log.durationMs} ms{log.responseSize != null ? ` · ${log.responseSize} bytes` : ''}</DetailRow>
      <DetailRow label="IP" mono>{log.ip || '—'}</DetailRow>
      <DetailRow label="Vị trí">{geoText}</DetailRow>
      <DetailRow label="Người dùng">
        {log.email || log.uid || 'Ẩn danh'}{log.role ? ` (${log.role})` : ''}{log.uid && log.email ? ` · uid: ${log.uid}` : ''}
      </DetailRow>
      <DetailRow label="User-Agent" mono>{log.userAgent || '—'}</DetailRow>
      <DetailRow label="Referer" mono>{log.referer || '—'}</DetailRow>
      <DetailRow label="Payload" mono>
        {log.body ? log.body : <Typography as="span" size="xs" variant="muted">— (không có / không phải method có body)</Typography>}
      </DetailRow>
      {log.body ? <Typography size="xs" variant="muted" layoutClassName="pt-1">* Các trường nhạy cảm (mật khẩu, token...) đã được che.</Typography> : null}
    </Box>
  );
};

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box layoutClassName="space-y-1">
    <Typography size="xs" variant="muted">{label}</Typography>
    {children}
  </Box>
);

export default LogsTable;
