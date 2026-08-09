import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, ScanFace, Trash2, Wifi } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import FaceEnrollModal from '@/pages/Attendance/components/FaceEnrollModal';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
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
  useAttendanceHistory,
  useAttendanceOverview,
  useNetworkMutations,
  useNetworks,
} from '@/hooks/queries/useAttendanceQuery';
import { fetchCurrentIp } from '@/services/attendanceService';
import { kindLabel } from '@/types/attendance';

const fmtDateTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const ManageTab: React.FC = () => {
  const { userData } = useAuth();
  const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
  const { networks, loading: netLoading } = useNetworks(true);
  const { rows: overview, loading: ovLoading } = useAttendanceOverview(true);
  const { upsertNetwork, deleteNetwork, clearFace } = useNetworkMutations();

  const [label, setLabel] = useState('');
  const [ipCidr, setIpCidr] = useState('');
  const [savingNet, setSavingNet] = useState(false);
  // Modal đăng ký khuôn mặt cho 1 NV (chỉ super_admin).
  const [enroll, setEnroll] = useState<{ employeeId: string; name: string } | null>(null);

  const [empFilter, setEmpFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const historyParams = useMemo(
    () => ({ employeeId: empFilter || undefined, from: from || undefined, to: to || undefined, limit: 200 }),
    [empFilter, from, to],
  );
  const { data: history, loading: hisLoading } = useAttendanceHistory(historyParams, true);

  const useCurrentIp = async () => {
    try {
      const { ip, suggestedCidr } = await fetchCurrentIp();
      setIpCidr(suggestedCidr || ip);
      toast.success(`IP: ${ip} → dùng dải ${suggestedCidr || ip}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không lấy được IP.');
    }
  };

  const addNetwork = async () => {
    if (!ipCidr.trim()) {
      toast.error('Nhập IP hoặc dải IP (vd 113.161.10.20 hoặc 1.2.3.0/24).');
      return;
    }
    setSavingNet(true);
    try {
      await upsertNetwork({ label: label.trim() || null, ipCidr: ipCidr.trim(), active: true });
      toast.success('Đã thêm mạng cho phép.');
      setLabel('');
      setIpCidr('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thêm thất bại.');
    } finally {
      setSavingNet(false);
    }
  };

  const removeNetwork = async (id: string) => {
    if (!window.confirm('Xoá dải mạng này?')) return;
    try {
      await deleteNetwork(id);
      toast.success('Đã xoá.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  const removeFace = async (employeeId: string, name: string) => {
    if (!window.confirm(`Xoá dữ liệu khuôn mặt của "${name}"? Nhân viên sẽ phải đăng ký lại.`)) return;
    try {
      const r = await clearFace(employeeId);
      toast.success(`Đã xoá ${r.deleted} mẫu khuôn mặt.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  return (
    <Box layoutClassName="flex flex-col gap-6">
      {/* ------- Mạng quán ------- */}
      <Card
        padding="lg"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="mb-4 flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary-500" />
          <Heading level={2} textClassName="text-base font-bold text-slate-900 dark:text-white">
            Mạng quán được phép chấm công
          </Heading>
        </Box>
        <Typography size="xs" layoutClassName="mb-3" textClassName="text-slate-500 dark:text-slate-400">
          Chỉ chấm công được khi thiết bị dùng IP nằm trong danh sách này. Mở wifi quán rồi bấm
          "IP hiện tại" — với IPv6 hệ thống tự lấy DẢI /48 (khối nhà mạng cấp, bắt mọi địa chỉ IPv6
          của quán dù đổi liên tục), IPv4 lấy /32. Nên thêm CẢ IPv6 lẫn IPv4. Router restart đổi dải thì bấm lấy lại.
        </Typography>
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Nhãn" htmlFor="net-label">
            <Input id="net-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wifi quán" />
          </Field>
          <Field label="IP / dải IP" htmlFor="net-ip">
            <Input id="net-ip" value={ipCidr} onChange={(e) => setIpCidr(e.target.value)} placeholder="113.161.10.20 hoặc 1.2.3.0/24" />
          </Field>
          <Box layoutClassName="flex gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<MapPin className="h-4 w-4" />} onClick={useCurrentIp}>
              IP hiện tại
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={savingNet} leftIcon={<Plus className="h-4 w-4" />} onClick={addNetwork}>
              Thêm
            </Button>
          </Box>
        </Box>

        <Box layoutClassName="mt-4">
          {netLoading ? (
            <Spinner size="sm" textClassName="text-primary-500" />
          ) : networks.length === 0 ? (
            <Typography size="sm" textClassName="text-amber-600 dark:text-amber-400">
              Chưa có mạng nào — nhân viên sẽ KHÔNG chấm công được cho tới khi thêm IP quán.
            </Typography>
          ) : (
            <Box layoutClassName="flex flex-col gap-2">
              {networks.map((n) => (
                <Box
                  key={n.id}
                  layoutClassName="flex items-center justify-between gap-2 px-3 py-2"
                  roundedClassName="rounded-lg"
                  backgroundClassName="bg-slate-50 dark:bg-slate-700/40"
                >
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography as="span" size="sm" layoutClassName="font-mono font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                      {n.ipCidr}
                    </Typography>
                    {n.label && (
                      <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">
                        ({n.label})
                      </Typography>
                    )}
                    {!n.active && <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-slate-200 dark:bg-slate-600" textClassName="text-slate-500">tắt</Badge>}
                  </Box>
                  <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => removeNetwork(n.id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Card>

      {/* ------- Tổng quan nhân viên ------- */}
      <Card
        padding="none"
        layoutClassName="overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="flex items-center gap-2 px-4 py-3">
          <Heading level={2} textClassName="text-base font-bold text-slate-900 dark:text-white">
            Nhân viên hôm nay
          </Heading>
        </Box>
        <Box layoutClassName="overflow-x-auto">
          {ovLoading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : overview.length === 0 ? (
            <EmptyState title="Chưa có nhân viên nào." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Tên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Email đăng nhập</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Khuôn mặt</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Vào</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Ra</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Thao tác</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overview.map((r) => (
                  <TableRow key={r.employeeId} borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{r.name}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      {r.email ? (
                        <Typography as="span" size="sm" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">{r.email}</Typography>
                      ) : (
                        <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">chưa gắn</Badge>
                      )}
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Badge
                        size="sm"
                        layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                        backgroundClassName={r.faceCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                        textClassName={r.faceCount > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}
                      >
                        {r.faceCount > 0 ? `${r.faceCount} mẫu` : 'chưa có'}
                      </Badge>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Typography as="span" size="sm" textClassName="text-emerald-600 dark:text-emerald-400">{fmtTime(r.todayIn)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Typography as="span" size="sm" textClassName="text-rose-600 dark:text-rose-400">{fmtTime(r.todayOut)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Box layoutClassName="inline-flex items-center gap-1">
                        {isSuperAdmin && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<ScanFace className="h-3.5 w-3.5" />}
                            onClick={() => setEnroll({ employeeId: r.employeeId, name: r.name })}
                          >
                            {r.faceCount > 0 ? 'Đăng ký lại' : 'Đăng ký mặt'}
                          </Button>
                        )}
                        {r.faceCount > 0 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFace(r.employeeId, r.name)}>
                            Xoá
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* ------- Lịch sử ------- */}
      <Card
        padding="none"
        layoutClassName="overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="flex flex-wrap items-end gap-3 px-4 py-3">
          <Heading level={2} textClassName="mr-auto text-base font-bold text-slate-900 dark:text-white">
            Lịch sử chấm công
          </Heading>
          <Field label="Nhân viên" htmlFor="his-emp">
            <Select id="his-emp" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="">Tất cả</option>
              {overview.map((r) => (
                <option key={r.employeeId} value={r.employeeId}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Từ ngày" htmlFor="his-from">
            <Input id="his-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Đến ngày" htmlFor="his-to">
            <Input id="his-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </Box>
        <Box layoutClassName="overflow-x-auto">
          {hisLoading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : !history || history.items.length === 0 ? (
            <EmptyState title="Chưa có bản ghi chấm công." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Thời gian</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Nhân viên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Loại</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">IP</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Độ khớp</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.items.map((rec) => (
                  <TableRow key={rec.id} borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">{fmtDateTime(rec.checkedAt)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">{rec.employeeName || rec.employeeId}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Badge
                        size="sm"
                        layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                        backgroundClassName={rec.kind === 'in' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
                        textClassName={rec.kind === 'in' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
                      >
                        {kindLabel(rec.kind)}
                      </Badge>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-500 dark:text-slate-400">{rec.ip || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-500 dark:text-slate-400">
                        {rec.faceDistance != null ? rec.faceDistance.toFixed(3) : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      <FaceEnrollModal
        isOpen={!!enroll}
        onClose={() => setEnroll(null)}
        employee={enroll}
        onDone={() => setEnroll(null)}
      />
    </Box>
  );
};

export default ManageTab;
