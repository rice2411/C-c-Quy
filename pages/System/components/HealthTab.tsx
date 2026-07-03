import React from 'react';
import { HeartPulse, Database, Clock, Server, Tag, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useHealth } from '@/hooks/queries/useRequestLogsQuery';

/** giây → "2 ngày 3 giờ 10 phút". */
const fmtUptime = (sec: number): string => {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return [d ? `${d} ngày` : '', h ? `${h} giờ` : '', `${m} phút`].filter(Boolean).join(' ');
};

const HealthTab: React.FC = () => {
  const { data, loading, refetch } = useHealth();
  const ok = data?.status === 'ok';

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <Typography size="sm" variant="muted">Tự cập nhật mỗi 30 giây.</Typography>
        </Box>
        <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>Kiểm tra lại</Button>
      </Box>

      {loading && !data ? (
        <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
      ) : !data ? (
        <Card padding="lg">
          <Box layoutClassName="flex flex-col items-center gap-2 py-8">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <Typography textClassName="text-red-600 dark:text-red-400">Không kết nối được backend.</Typography>
          </Box>
        </Card>
      ) : (
        <>
          {/* Trạng thái tổng */}
          <Card padding="md" backgroundClassName={ok ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} borderClassName={ok ? 'border border-emerald-200 dark:border-emerald-800' : 'border border-red-200 dark:border-red-800'}>
            <Box layoutClassName="flex items-center gap-3">
              {ok ? <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 shrink-0" />}
              <Box>
                <Heading level={4} textClassName={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>
                  {ok ? 'Hệ thống ổn định' : 'Hệ thống có vấn đề'}
                </Heading>
                <Typography size="sm" variant="muted">Cập nhật lúc {new Date(data.time).toLocaleString('vi-VN')}</Typography>
              </Box>
            </Box>
          </Card>

          {/* Chi tiết */}
          <Box layoutClassName="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard icon={<Database className={`w-5 h-5 ${data.db ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />} label="Cơ sở dữ liệu" value={data.db ? 'Kết nối OK' : 'Mất kết nối'} extra={data.dbLatencyMs != null ? `${data.dbLatencyMs} ms` : undefined} />
            <InfoCard icon={<Clock className="w-5 h-5 text-primary-600 dark:text-primary-500" />} label="Uptime" value={fmtUptime(data.uptimeSec)} />
            <InfoCard icon={<Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />} label="Môi trường" value={data.env || '—'} />
            <InfoCard icon={<Tag className="w-5 h-5 text-slate-500" />} label="Phiên bản" value={data.version || '—'} />
          </Box>

          <Card padding="md">
            <Box layoutClassName="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-slate-400" />
              <Typography size="sm" variant="muted">Service: {data.service}</Typography>
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName={ok ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'} textClassName={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{data.status}</Badge>
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string; extra?: string }> = ({ icon, label, value, extra }) => (
  <Card padding="md">
    <Box layoutClassName="flex items-center gap-3">
      <Box layoutClassName="w-10 h-10 flex items-center justify-center shrink-0" backgroundClassName="bg-slate-100 dark:bg-slate-700/50" roundedClassName="rounded-xl">{icon}</Box>
      <Box layoutClassName="min-w-0">
        <Typography size="xs" variant="muted" layoutClassName="truncate">{label}</Typography>
        <Heading level={4}>{value}</Heading>
        {extra ? <Typography size="xs" variant="muted">{extra}</Typography> : null}
      </Box>
    </Box>
  </Card>
);

export default HealthTab;
