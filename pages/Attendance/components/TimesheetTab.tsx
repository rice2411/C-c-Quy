import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
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
  usePayroll,
} from '@/hooks/queries/useAttendanceQuery';
import type { AttendanceAdjustment, PayrollDay, PayrollRow } from '@/types/attendance';
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
}

type AdjTarget = { employeeId: string; name: string; date: string };

/** SỔ CÔNG & LƯƠNG: danh sách MỌI nhân viên theo tháng, bấm bung chi tiết từng ngày
 *  (đăng ký ca + chấm công + công/giờ), bổ sung công tại chỗ, xuất Excel. */
const TimesheetTab: React.FC<Props> = ({ month, onMonthChange }) => {
  // (1) state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adjTarget, setAdjTarget] = useState<AdjTarget | null>(null);
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // (2) data
  const range = useMemo(() => monthRange(month), [month]);
  const { data: payroll, loading } = usePayroll(range, true);
  const { rows: adjustments } = useAdjustments(range, true);
  const { addAdjustment, deleteAdjustment } = useAdjustmentMutations();

  const employees = payroll?.employees ?? [];

  /** Bổ sung công theo (NV|ngày) để hiện + xoá trong chi tiết. */
  const adjByKey = useMemo(() => {
    const map = new Map<string, AttendanceAdjustment[]>();
    for (const a of adjustments) {
      const k = `${a.employeeId}|${a.workDate}`;
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return map;
  }, [adjustments]);

  const modalAdjs = adjTarget ? adjByKey.get(`${adjTarget.employeeId}|${adjTarget.date}`) ?? [] : [];

  // (3) handlers
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openAdjust = (employeeId: string, name: string, date: string) => {
    setAdjTarget({ employeeId, name, date });
    setHours('');
    setReason('');
  };

  const submitAdjust = async () => {
    if (!adjTarget) return;
    const h = Number(hours);
    if (!adjTarget.date) {
      toast.error('Chọn ngày bổ sung.');
      return;
    }
    if (!Number.isFinite(h) || h === 0) {
      toast.error('Nhập số giờ bổ sung (khác 0).');
      return;
    }
    setSaving(true);
    try {
      await addAdjustment({ employeeId: adjTarget.employeeId, workDate: adjTarget.date, hours: h, reason: reason.trim() || undefined });
      toast.success(`Đã bổ sung ${fmtHours(h)} cho ${adjTarget.name}.`);
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

  const exportExcel = async () => {
    if (employees.length === 0) {
      toast.error('Chưa có dữ liệu để xuất.');
      return;
    }
    try {
      const XLSX = await import('xlsx-js-style');
      const header = ['Nhân viên', 'Vị trí', 'Ca đăng ký', 'Ca hợp lệ', 'Tổng công', 'Giờ chấm', 'Giờ bổ sung', 'Tổng giờ', 'Lương (VND)'];
      const body = employees.map((r) => [
        r.name, r.position ?? '', r.registeredShifts, r.validShifts, r.totalCong, r.workHours, r.adjHours, r.totalHours, Math.round(r.salary),
      ]);
      const total = ['TỔNG', '', '', '', '', '', '', payroll?.totalHours ?? 0, Math.round(payroll?.totalSalary ?? 0)];
      const ws = XLSX.utils.aoa_to_sheet([header, ...body, total]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SoCong');
      XLSX.writeFile(wb, `so-cong-luong-${month}.xlsx`);
    } catch {
      toast.error('Xuất Excel thất bại.');
    }
  };

  const th = 'px-4 py-3';

  // (4) render
  return (
    <Box layoutClassName="flex flex-col gap-4">
      {/* Tổng quan kỳ */}
      <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Tổng lương kỳ</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">{vnd(payroll?.totalSalary ?? 0)}</Typography>
        </Card>
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Tổng giờ làm</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-slate-900 dark:text-white">{fmtHours(payroll?.totalHours ?? 0)}</Typography>
        </Card>
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Số nhân viên</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-slate-900 dark:text-white">{employees.length}</Typography>
        </Card>
      </Box>

      {/* Toolbar + danh sách trong 1 container */}
      <Card padding="none" layoutClassName="overflow-hidden" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
        <Box
          layoutClassName="flex flex-wrap items-center gap-3 px-4 py-3"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
        >
          <Box layoutClassName="mr-auto flex items-center gap-1">
            <IconButton label="Tháng trước" size="sm" variant="ghost" onClick={() => onMonthChange(shiftMonth(month, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Input type="month" value={month} onChange={(e) => onMonthChange(e.target.value || currentMonth())} sizeClassName="w-40" />
            <IconButton label="Tháng sau" size="sm" variant="ghost" onClick={() => onMonthChange(shiftMonth(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </Box>
          <Button type="button" variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportExcel}>
            Xuất Excel
          </Button>
        </Box>

        <Box layoutClassName="overflow-x-auto">
          {loading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : employees.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu công trong kỳ này." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName={th}>Nhân viên</TableHeaderCell>
                  <TableHeaderCell layoutClassName={th}>Vị trí</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Ca ĐK</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Ca hợp lệ</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Công</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-center`}>Giờ</TableHeaderCell>
                  <TableHeaderCell layoutClassName={`${th} text-right`}>Lương</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((r) => (
                  <EmpRow
                    key={r.employeeId}
                    row={r}
                    open={expanded.has(r.employeeId)}
                    onToggle={() => toggle(r.employeeId)}
                    adjByKey={adjByKey}
                    onAdjust={(date) => openAdjust(r.employeeId, r.name, date)}
                    onRemoveAdjust={removeAdjust}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Modal bổ sung công cho 1 NV / 1 ngày */}
      <BaseModal isOpen={!!adjTarget} onClose={() => setAdjTarget(null)} title={`Bổ sung công — ${adjTarget?.name ?? ''}`} size="sm">
        {adjTarget && (
          <Box layoutClassName="flex flex-col gap-4">
            <Field label="Ngày" htmlFor="ts-adj-date">
              <Input id="ts-adj-date" type="date" value={adjTarget.date} onChange={(e) => setAdjTarget({ ...adjTarget, date: e.target.value })} min={range.from} max={range.to} />
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
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdjTarget(null)}>Đóng</Button>
              <Button type="button" variant="primary" size="sm" disabled={saving} leftIcon={<Plus className="h-4 w-4" />} onClick={submitAdjust}>Thêm</Button>
            </Box>
          </Box>
        )}
      </BaseModal>
    </Box>
  );
};

// ── 1 nhân viên: dòng tổng (bấm bung) + chi tiết theo ngày ──
const EmpRow: React.FC<{
  row: PayrollRow;
  open: boolean;
  onToggle: () => void;
  adjByKey: Map<string, AttendanceAdjustment[]>;
  onAdjust: (date: string) => void;
  onRemoveAdjust: (a: AttendanceAdjustment) => void;
}> = ({ row, open, onToggle, adjByKey, onAdjust, onRemoveAdjust }) => {
  const td = 'px-4 py-3';
  const missingRate = row.days.some((d) => d.hours > 0 && d.rate == null);
  return (
    <>
      <TableRow
        borderClassName="border-b border-slate-100 dark:border-slate-700/60"
        layoutClassName="cursor-pointer"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
        stateClassName="transition-colors"
        onClick={onToggle}
      >
        <TableCell layoutClassName={`${td} whitespace-nowrap`}>
          <Box layoutClassName="flex items-center gap-1.5">
            {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{row.name}</Typography>
          </Box>
        </TableCell>
        <TableCell layoutClassName={`${td} whitespace-nowrap`}>
          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{row.position || '—'}</Typography>
        </TableCell>
        <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
          <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{row.registeredShifts}</Typography>
        </TableCell>
        <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
          <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-emerald-600 dark:text-emerald-400">{row.validShifts}</Typography>
        </TableCell>
        <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
          <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{row.totalCong}</Typography>
        </TableCell>
        <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
          <Box layoutClassName="inline-flex items-center gap-1">
            <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{fmtHours(row.totalHours)}</Typography>
            {row.adjHours !== 0 && (
              <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
                {row.adjHours > 0 ? '+' : ''}{fmtHours(row.adjHours)}
              </Badge>
            )}
          </Box>
        </TableCell>
        <TableCell layoutClassName={`${td} text-right whitespace-nowrap`}>
          <Box layoutClassName="inline-flex items-center gap-1">
            {missingRate && (
              <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">chưa đặt mức</Badge>
            )}
            <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">{vnd(row.salary)}</Typography>
          </Box>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
          <TableCell layoutClassName="px-4 py-3" colSpan={7}>
            <DayDetail row={row} adjByKey={adjByKey} onAdjust={onAdjust} onRemoveAdjust={onRemoveAdjust} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ── Chi tiết theo ngày của 1 NV ──
const DayDetail: React.FC<{
  row: PayrollRow;
  adjByKey: Map<string, AttendanceAdjustment[]>;
  onAdjust: (date: string) => void;
  onRemoveAdjust: (a: AttendanceAdjustment) => void;
}> = ({ row, adjByKey, onAdjust, onRemoveAdjust }) => {
  const td = 'px-3 py-2';
  if (row.days.length === 0) {
    return <Typography size="sm" textClassName="text-slate-500 dark:text-slate-400">Không có công/chấm công trong tháng.</Typography>;
  }
  return (
    <Box layoutClassName="overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow textClassName="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <TableHeaderCell layoutClassName={td}>Ngày</TableHeaderCell>
            <TableHeaderCell layoutClassName={td}>Đăng ký ca</TableHeaderCell>
            <TableHeaderCell layoutClassName={td}>Chấm công</TableHeaderCell>
            <TableHeaderCell layoutClassName={`${td} text-center`}>Ca hợp lệ</TableHeaderCell>
            <TableHeaderCell layoutClassName={`${td} text-center`}>Công</TableHeaderCell>
            <TableHeaderCell layoutClassName={`${td} text-center`}>Giờ</TableHeaderCell>
            <TableHeaderCell layoutClassName={`${td} text-right`}> </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {row.days.map((d) => (
            <DayRow
              key={d.date}
              day={d}
              adjustments={adjByKey.get(`${row.employeeId}|${d.date}`) ?? []}
              onAdjust={() => onAdjust(d.date)}
              onRemoveAdjust={onRemoveAdjust}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

// ── 1 dòng ngày: đăng ký ca + chấm công + hợp lệ + công + giờ ──
const DayRow: React.FC<{
  day: PayrollDay;
  adjustments: AttendanceAdjustment[];
  onAdjust: () => void;
  onRemoveAdjust: (a: AttendanceAdjustment) => void;
}> = ({ day, adjustments, onAdjust, onRemoveAdjust }) => {
  const td = 'px-3 py-2';
  const registered = day.shifts.filter((s) => s.registered);
  const hasAtt = !!day.in;
  const hasAdj = adjustments.length > 0 || day.adjHours !== 0;

  return (
    <TableRow borderClassName="border-b border-slate-100 dark:border-slate-700/40 last:border-0">
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        <Box layoutClassName="flex items-baseline gap-1.5">
          <Typography as="span" size="xs" layoutClassName="font-medium tabular-nums" textClassName="text-slate-800 dark:text-slate-100">{fmtDay(day.date)}</Typography>
          <Typography as="span" size="xs" textClassName="text-slate-400">{dowLabel(day.date)}</Typography>
        </Box>
      </TableCell>
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        {registered.length === 0 ? (
          <Typography as="span" size="xs" textClassName="text-slate-300 dark:text-slate-600">—</Typography>
        ) : (
          <Box layoutClassName="flex flex-wrap gap-1">
            {registered.map((s) => (
              <Badge key={s.code} size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName={s.valid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'} textClassName={s.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}>
                {s.name}
              </Badge>
            ))}
          </Box>
        )}
      </TableCell>
      <TableCell layoutClassName={`${td} whitespace-nowrap`}>
        {hasAtt ? (
          <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">
            {fmtTime(day.in)} → {day.out ? fmtTime(day.out) : '…'}
          </Typography>
        ) : registered.length > 0 ? (
          <Typography as="span" size="xs" textClassName="text-rose-500">vắng</Typography>
        ) : (
          <Typography as="span" size="xs" textClassName="text-slate-300 dark:text-slate-600">—</Typography>
        )}
      </TableCell>
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName={day.valid > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
          {day.valid}/{day.registered}
        </Typography>
      </TableCell>
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{day.cong}</Typography>
      </TableCell>
      <TableCell layoutClassName={`${td} text-center whitespace-nowrap`}>
        <Box layoutClassName="inline-flex items-center gap-1">
          <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{fmtHours(day.hours)}</Typography>
          {day.adjHours !== 0 && (
            <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
              {day.adjHours > 0 ? '+' : ''}{fmtHours(day.adjHours)}
            </Badge>
          )}
        </Box>
      </TableCell>
      <TableCell layoutClassName={`${td} text-right whitespace-nowrap`}>
        <Box layoutClassName="inline-flex items-center gap-1">
          {adjustments.map((a) => (
            <IconButton key={a.id} label="Xoá bổ sung" size="sm" variant="ghost" onClick={() => onRemoveAdjust(a)}>
              <Trash2 className="h-3 w-3 text-rose-400" />
            </IconButton>
          ))}
          <Button type="button" variant={hasAdj ? 'secondary' : 'ghost'} size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onAdjust}>
            {hasAdj ? 'Sửa' : 'Bổ sung'}
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default TimesheetTab;
