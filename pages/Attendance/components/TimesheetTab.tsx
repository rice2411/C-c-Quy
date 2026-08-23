import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import BaseModal from '@/components/BaseModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  useAdjustmentMutations,
  useAdjustments,
  useAttendanceOverview,
  usePayroll,
} from '@/hooks/queries/useAttendanceQuery';
import type { AttendanceAdjustment, PayrollDay } from '@/types/attendance';
import {
  currentMonth,
  dowLabel,
  fmtDay,
  fmtHours,
  fmtTime,
  monthRange,
  shiftMonth,
  vnd,
} from './payrollUtil';

interface Props {
  month: string;
  onMonthChange: (m: string) => void;
  employeeId: string;
  onEmployeeChange: (id: string) => void;
}

/** SỔ CÔNG theo từng NV: mỗi ngày xem đồng thời đăng ký ca + chấm công + công/giờ, bổ sung tại chỗ. */
const TimesheetTab: React.FC<Props> = ({ month, onMonthChange, employeeId, onEmployeeChange }) => {
  // (1) state
  const [adjDate, setAdjDate] = useState<string>(''); // ngày đang mở modal bổ sung ('' = đóng)
  const [hours, setHours] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // (2) data
  const range = useMemo(() => monthRange(month), [month]);
  const { rows: overview } = useAttendanceOverview(true);
  const { data: payroll, loading } = usePayroll({ ...range, employeeId }, !!employeeId);
  const { rows: adjustments } = useAdjustments({ ...range, employeeId }, !!employeeId);
  const { addAdjustment, deleteAdjustment } = useAdjustmentMutations();

  const row = payroll?.employees?.[0] ?? null;
  const days = row?.days ?? [];

  /** Bổ sung công theo ngày (để hiện badge + xoá). */
  const adjByDate = useMemo(() => {
    const map = new Map<string, AttendanceAdjustment[]>();
    for (const a of adjustments) {
      const arr = map.get(a.workDate) ?? [];
      arr.push(a);
      map.set(a.workDate, arr);
    }
    return map;
  }, [adjustments]);

  const selectedName = overview.find((o) => o.employeeId === employeeId)?.name ?? row?.name ?? '';

  // (3) auto-chọn NV đầu tiên khi chưa chọn
  useEffect(() => {
    if (!employeeId && overview.length > 0) onEmployeeChange(overview[0].employeeId);
  }, [employeeId, overview, onEmployeeChange]);

  // (4) handlers
  const openAdjust = (date: string) => {
    setAdjDate(date);
    setHours('');
    setReason('');
  };

  const submitAdjust = async () => {
    const h = Number(hours);
    if (!Number.isFinite(h) || h === 0) {
      toast.error('Nhập số giờ bổ sung (khác 0).');
      return;
    }
    setSaving(true);
    try {
      await addAdjustment({ employeeId, workDate: adjDate, hours: h, reason: reason.trim() || undefined });
      toast.success(`Đã bổ sung ${fmtHours(h)} ngày ${fmtDay(adjDate)}.`);
      setHours('');
      setReason('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bổ sung thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const removeAdjust = async (a: AttendanceAdjustment) => {
    if (!window.confirm(`Xoá bổ sung ${fmtHours(a.hours)}?`)) return;
    try {
      await deleteAdjustment(a.id);
      toast.success('Đã xoá bổ sung.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  const modalAdjs = adjDate ? adjByDate.get(adjDate) ?? [] : [];
  const th = 'px-3 py-2.5';

  // (5) render
  return (
    <Box layoutClassName="flex flex-col gap-4">
      {/* Toolbar + sổ công trong 1 container (giống Orders) */}
      <Card padding="none" layoutClassName="overflow-hidden" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
        {/* Toolbar: chọn NV + tháng + tổng + bổ sung */}
        <Box
          layoutClassName="flex flex-wrap items-end gap-3 px-4 py-3"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
        >
          <Field label="Nhân viên" htmlFor="ts-emp">
            <Select id="ts-emp" value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)} sizeClassName="min-w-48">
              {overview.length === 0 && <option value="">— chưa có nhân viên —</option>}
              {overview.map((o) => (
                <option key={o.employeeId} value={o.employeeId}>{o.name}</option>
              ))}
            </Select>
          </Field>
          <Box layoutClassName="flex items-center gap-1">
            <IconButton label="Tháng trước" size="sm" variant="ghost" onClick={() => onMonthChange(shiftMonth(month, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Input type="month" value={month} onChange={(e) => onMonthChange(e.target.value || currentMonth())} sizeClassName="w-40" />
            <IconButton label="Tháng sau" size="sm" variant="ghost" onClick={() => onMonthChange(shiftMonth(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </Box>
          <Box layoutClassName="ml-auto flex items-center gap-4">
            <Box layoutClassName="text-right">
              <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Tổng giờ</Typography>
              <Typography size="lg" layoutClassName="font-bold tabular-nums" textClassName="text-slate-900 dark:text-white">{fmtHours(row?.totalHours ?? 0)}</Typography>
            </Box>
            <Box layoutClassName="text-right">
              <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Lương kỳ</Typography>
              <Typography size="lg" layoutClassName="font-bold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">{vnd(row?.salary ?? 0)}</Typography>
            </Box>
            <Button type="button" variant="secondary" size="sm" leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => openAdjust(range.from)} disabled={!employeeId}>
              Bổ sung công
            </Button>
          </Box>
        </Box>

        {/* Cảnh báo chưa đặt mức lương/giờ → lương = 0 */}
        {row && row.days.some((d) => d.hours > 0 && d.rate == null) && (
          <Box layoutClassName="flex items-center gap-2 px-4 py-2" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" borderClassName="border-b border-amber-200 dark:border-amber-800">
            <Typography size="xs" textClassName="text-amber-700 dark:text-amber-300">
              Nhân viên này chưa đặt <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-amber-800 dark:text-amber-200">mức lương/giờ</Typography> nên lương = 0. Vào <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-amber-800 dark:text-amber-200">Nhân viên</Typography> → mở NV → đặt mức lương/giờ.
            </Typography>
          </Box>
        )}

        <Box layoutClassName="overflow-x-auto">
          {loading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : !row || days.length === 0 ? (
            <EmptyState title="Chưa có công/chấm công trong tháng này." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName={th}>Ngày</TableHeaderCell>
                  <TableHeaderCell layoutClassName={th}>Đăng ký ca</TableHeaderCell>
                  <TableHeaderCell layoutClassName={th}>Chấm công</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Ca hợp lệ</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Công</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Giờ</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-right`}> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {days.map((d) => (
                  <DayRow
                    key={d.date}
                    day={d}
                    adjustments={adjByDate.get(d.date) ?? []}
                    onAdjust={() => openAdjust(d.date)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Modal bổ sung công cho 1 ngày (kèm danh sách đã bổ sung + xoá) */}
      <BaseModal isOpen={!!adjDate} onClose={() => setAdjDate('')} title={`Bổ sung công — ${selectedName}`} size="sm">
        <Box layoutClassName="flex flex-col gap-4">
          <Field label="Ngày" htmlFor="ts-adj-date">
            <Input id="ts-adj-date" type="date" value={adjDate} onChange={(e) => setAdjDate(e.target.value)} min={range.from} max={range.to} />
          </Field>

          {modalAdjs.length > 0 && (
            <Box layoutClassName="flex flex-col gap-1.5">
              <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Đã bổ sung ngày này</Typography>
              {modalAdjs.map((a) => (
                <Box key={a.id} layoutClassName="flex items-center justify-between gap-2 px-3 py-1.5" roundedClassName="rounded-lg" backgroundClassName="bg-slate-50 dark:bg-slate-700/40">
                  <Box layoutClassName="flex items-center gap-2">
                    <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
                      {a.hours > 0 ? '+' : ''}{fmtHours(a.hours)}
                    </Badge>
                    {a.reason && <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">{a.reason}</Typography>}
                  </Box>
                  <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => removeAdjust(a)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box layoutClassName="grid grid-cols-2 gap-3">
            <Field label="Số giờ (âm = trừ)" htmlFor="ts-adj-hours">
              <Input id="ts-adj-hours" type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="vd 4 hoặc -2" />
            </Field>
            <Field label="Lý do" htmlFor="ts-adj-reason">
              <Input id="ts-adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Quên chấm, làm bù…" />
            </Field>
          </Box>
          <Box layoutClassName="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdjDate('')}>Đóng</Button>
            <Button type="button" variant="primary" size="sm" disabled={saving} leftIcon={<Plus className="h-4 w-4" />} onClick={submitAdjust}>Thêm</Button>
          </Box>
        </Box>
      </BaseModal>
    </Box>
  );
};

// ── 1 dòng ngày: đăng ký ca + chấm công + hợp lệ + công + giờ ──
const DayRow: React.FC<{
  day: PayrollDay;
  adjustments: AttendanceAdjustment[];
  onAdjust: () => void;
}> = ({ day, adjustments, onAdjust }) => {
  const td = 'px-3 py-2.5';
  const registered = day.shifts.filter((s) => s.registered);
  const hasAtt = !!day.in;
  const hasAdj = adjustments.length > 0 || day.adjHours !== 0;

  return (
    <TableRow borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        <Box layoutClassName="flex items-baseline gap-1.5">
          <Typography as="span" size="sm" layoutClassName="font-medium tabular-nums" textClassName="text-slate-800 dark:text-slate-100">{fmtDay(day.date)}</Typography>
          <Typography as="span" size="xs" textClassName="text-slate-400">{dowLabel(day.date)}</Typography>
        </Box>
      </TableCell>

      {/* Đăng ký ca */}
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        {registered.length === 0 ? (
          <Typography as="span" size="xs" textClassName="text-slate-300 dark:text-slate-600">—</Typography>
        ) : (
          <Box layoutClassName="flex flex-wrap gap-1">
            {registered.map((s) => (
              <Badge
                key={s.code}
                size="sm"
                layoutClassName="px-1.5 py-0.5 text-[10px]"
                backgroundClassName={s.valid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                textClassName={s.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
              >
                {s.name}
              </Badge>
            ))}
          </Box>
        )}
      </TableCell>

      {/* Chấm công (vào → ra) */}
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        {hasAtt ? (
          <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">
            {fmtTime(day.in)} → {day.out ? fmtTime(day.out) : '…'}
          </Typography>
        ) : registered.length > 0 ? (
          <Typography as="span" size="xs" textClassName="text-rose-500">vắng</Typography>
        ) : (
          <Typography as="span" size="xs" textClassName="text-slate-300 dark:text-slate-600">—</Typography>
        )}
      </TableCell>

      {/* Ca hợp lệ */}
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName={day.valid > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
          {day.valid}/{day.registered}
        </Typography>
      </TableCell>

      {/* Công */}
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{day.cong}</Typography>
      </TableCell>

      {/* Giờ (+ bổ sung) */}
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Box layoutClassName="inline-flex items-center gap-1">
          <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{fmtHours(day.hours)}</Typography>
          {day.adjHours !== 0 && (
            <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
              {day.adjHours > 0 ? '+' : ''}{fmtHours(day.adjHours)}
            </Badge>
          )}
        </Box>
      </TableCell>

      {/* Nút bổ sung */}
      <TableCell layoutClassName={`${td} text-right whitespace-nowrap`}>
        <Button
          type="button"
          variant={hasAdj ? 'secondary' : 'ghost'}
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={onAdjust}
        >
          {hasAdj ? 'Sửa' : 'Bổ sung'}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TimesheetTab;
