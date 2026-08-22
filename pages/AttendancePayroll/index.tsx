import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Coins,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
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
import type { AttendanceAdjustment, PayrollRow } from '@/types/attendance';

// ── helpers ──
const pad2 = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM' của tháng hiện tại. */
const currentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/** Khoảng ngày [đầu tháng, cuối tháng] từ 'YYYY-MM'. */
const monthRange = (month: string): { from: string; to: string } => {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad2(last)}` };
};

/** Dịch tháng +/- n, giữ dạng 'YYYY-MM'. */
const shiftMonth = (month: string, delta: number): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

const vnd = (n: number): string => `${Math.round(n).toLocaleString('vi-VN')}đ`;
const fmtHours = (h: number): string =>
  Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
const fmtDay = (iso: string): string => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const AttendancePayrollPage: React.FC = () => {
  const { t } = useLanguage();

  // (1) state
  const [month, setMonth] = useState<string>(currentMonth());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adjFor, setAdjFor] = useState<{ employeeId: string; name: string } | null>(null);
  const [adjDate, setAdjDate] = useState<string>('');
  const [adjHours, setAdjHours] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // (2) derived + data
  const range = useMemo(() => monthRange(month), [month]);
  const { data: payroll, loading } = usePayroll(range, true);
  const { rows: adjustments } = useAdjustments(range, true);
  const { addAdjustment, deleteAdjustment } = useAdjustmentMutations();

  /** Bổ sung công theo từng NV (để hiện + xoá trong dòng mở rộng). */
  const adjByEmployee = useMemo(() => {
    const map = new Map<string, AttendanceAdjustment[]>();
    for (const a of adjustments) {
      const arr = map.get(a.employeeId) ?? [];
      arr.push(a);
      map.set(a.employeeId, arr);
    }
    return map;
  }, [adjustments]);

  const employees = payroll?.employees ?? [];

  // (3) handlers
  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdjust = (row: { employeeId: string; name: string }) => {
    setAdjFor(row);
    setAdjDate(range.to > currentMonth() ? range.from : `${month}-${pad2(new Date().getDate())}`);
    setAdjHours('');
    setAdjReason('');
  };

  const submitAdjust = async () => {
    if (!adjFor) return;
    const hours = Number(adjHours);
    if (!adjDate) {
      toast.error('Chọn ngày bổ sung.');
      return;
    }
    if (!Number.isFinite(hours) || hours === 0) {
      toast.error('Nhập số giờ bổ sung (khác 0).');
      return;
    }
    setSaving(true);
    try {
      await addAdjustment({
        employeeId: adjFor.employeeId,
        workDate: adjDate,
        hours,
        reason: adjReason.trim() || undefined,
      });
      toast.success(`Đã bổ sung ${fmtHours(hours)} cho ${adjFor.name}.`);
      setAdjFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bổ sung thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const removeAdjust = async (a: AttendanceAdjustment) => {
    if (!window.confirm(`Xoá bổ sung ${fmtHours(a.hours)} ngày ${fmtDay(a.workDate)}?`)) return;
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
      const header = [
        'Nhân viên',
        'Vị trí',
        'Ca đăng ký',
        'Ca hợp lệ',
        'Tổng công',
        'Giờ chấm',
        'Giờ bổ sung',
        'Tổng giờ',
        'Lương (VND)',
      ];
      const body = employees.map((r) => [
        r.name,
        r.position ?? '',
        r.registeredShifts,
        r.validShifts,
        r.totalCong,
        r.workHours,
        r.adjHours,
        r.totalHours,
        Math.round(r.salary),
      ]);
      const total = [
        'TỔNG',
        '',
        '',
        '',
        '',
        '',
        '',
        payroll?.totalHours ?? 0,
        Math.round(payroll?.totalSalary ?? 0),
      ];
      const ws = XLSX.utils.aoa_to_sheet([header, ...body, total]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BangCong');
      XLSX.writeFile(wb, `bang-cong-luong-${month}.xlsx`);
    } catch {
      toast.error('Xuất Excel thất bại.');
    }
  };

  // (4) render
  const th = 'px-4 py-3';
  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* Tiêu đề + thao tác */}
      <Box layoutClassName="flex flex-wrap items-center gap-3">
        <Box layoutClassName="mr-auto flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            {t('nav.attendancePayroll')}
          </Heading>
        </Box>
        <Box layoutClassName="flex items-center gap-1">
          <IconButton label="Tháng trước" size="sm" variant="ghost" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            sizeClassName="w-40"
          />
          <IconButton label="Tháng sau" size="sm" variant="ghost" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </Box>
        <Button type="button" variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportExcel}>
          Xuất Excel
        </Button>
      </Box>

      {/* Tổng quan kỳ */}
      <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Tổng lương kỳ</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">
            {vnd(payroll?.totalSalary ?? 0)}
          </Typography>
        </Card>
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Tổng giờ làm</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-slate-900 dark:text-white">
            {fmtHours(payroll?.totalHours ?? 0)}
          </Typography>
        </Card>
        <Card padding="lg" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-800">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Số nhân viên</Typography>
          <Typography size="xl" layoutClassName="mt-1 font-bold tabular-nums" textClassName="text-slate-900 dark:text-white">
            {employees.length}
          </Typography>
        </Card>
      </Box>

      {/* Bảng công & lương */}
      <Card
        padding="none"
        layoutClassName="flex-1 overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="h-full overflow-auto">
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
                  <TableHeaderCell layoutClassName={`${th} text-right`}> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((r) => (
                  <PayrollRowView
                    key={r.employeeId}
                    row={r}
                    open={expanded.has(r.employeeId)}
                    onToggle={() => toggle(r.employeeId)}
                    adjustments={adjByEmployee.get(r.employeeId) ?? []}
                    onAdjust={() => openAdjust(r)}
                    onRemoveAdjust={removeAdjust}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Modal bổ sung công */}
      <BaseModal isOpen={!!adjFor} onClose={() => setAdjFor(null)} title="Bổ sung công" size="sm">
        {adjFor && (
          <Box layoutClassName="flex flex-col gap-4">
            <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">
              Bổ sung giờ công cho <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{adjFor.name}</Typography> (dùng khi quên chấm / làm bù). Nhập số âm để trừ bớt.
            </Typography>
            <Field label="Ngày" htmlFor="adj-date">
              <Input id="adj-date" type="date" value={adjDate} onChange={(e) => setAdjDate(e.target.value)} min={range.from} max={range.to} />
            </Field>
            <Field label="Số giờ bổ sung" htmlFor="adj-hours">
              <Input id="adj-hours" type="number" step="0.5" value={adjHours} onChange={(e) => setAdjHours(e.target.value)} placeholder="vd 4 hoặc -2" />
            </Field>
            <Field label="Lý do" htmlFor="adj-reason">
              <Input id="adj-reason" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Quên chấm công, làm bù…" />
            </Field>
            <Box layoutClassName="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdjFor(null)}>Huỷ</Button>
              <Button type="button" variant="primary" size="sm" disabled={saving} onClick={submitAdjust}>Lưu</Button>
            </Box>
          </Box>
        )}
      </BaseModal>
    </Box>
  );
};

// ── Dòng 1 nhân viên (có thể mở rộng xem theo ngày) ──
const PayrollRowView: React.FC<{
  row: PayrollRow;
  open: boolean;
  onToggle: () => void;
  adjustments: AttendanceAdjustment[];
  onAdjust: () => void;
  onRemoveAdjust: (a: AttendanceAdjustment) => void;
}> = ({ row, open, onToggle, adjustments, onAdjust, onRemoveAdjust }) => {
  const td = 'px-4 py-3';
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
          <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">{vnd(row.salary)}</Typography>
        </TableCell>
        <TableCell layoutClassName={`${td} text-right whitespace-nowrap`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAdjust(); }}
          >
            Bổ sung
          </Button>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
          <TableCell layoutClassName="px-4 py-3" colSpan={8}>
            <DayDetail row={row} adjustments={adjustments} onRemoveAdjust={onRemoveAdjust} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ── Chi tiết theo ngày + danh sách bổ sung của 1 NV ──
const DayDetail: React.FC<{
  row: PayrollRow;
  adjustments: AttendanceAdjustment[];
  onRemoveAdjust: (a: AttendanceAdjustment) => void;
}> = ({ row, adjustments, onRemoveAdjust }) => {
  const td = 'px-3 py-2';
  return (
    <Box layoutClassName="flex flex-col gap-4">
      {row.days.length === 0 ? (
        <Typography size="sm" textClassName="text-slate-500 dark:text-slate-400">Không có ngày công nào trong kỳ.</Typography>
      ) : (
        <Box layoutClassName="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow textClassName="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <TableHeaderCell layoutClassName={td}>Ngày</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-center`}>Ca ĐK</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-center`}>Ca hợp lệ</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-center`}>Công</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-center`}>Giờ chấm</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-center`}>Giờ bổ sung</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-right`}>Mức/giờ</TableHeaderCell>
                <TableHeaderCell layoutClassName={`${td} text-right`}>Tiền</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.days.map((d) => (
                <TableRow key={d.date} borderClassName="border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                  <TableCell layoutClassName={`${td} whitespace-nowrap`}>
                    <Typography as="span" size="xs" textClassName="text-slate-700 dark:text-slate-200">{fmtDay(d.date)}</Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-center`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-500 dark:text-slate-400">{d.registered}</Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-center`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-emerald-600 dark:text-emerald-400">{d.valid}</Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-center`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{d.cong}</Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-center`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{fmtHours(d.workHours)}</Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-center`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName={d.adjHours ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
                      {d.adjHours ? `${d.adjHours > 0 ? '+' : ''}${fmtHours(d.adjHours)}` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-right`}>
                    <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName={d.rate == null ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}>
                      {d.rate == null ? 'chưa có' : vnd(d.rate)}
                    </Typography>
                  </TableCell>
                  <TableCell layoutClassName={`${td} text-right`}>
                    <Typography as="span" size="xs" layoutClassName="font-medium tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{vnd(d.pay)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Danh sách bổ sung công của NV này trong kỳ */}
      {adjustments.length > 0 && (
        <Box layoutClassName="flex flex-col gap-1.5">
          <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Bổ sung công đã thêm</Typography>
          {adjustments.map((a) => (
            <Box
              key={a.id}
              layoutClassName="flex items-center justify-between gap-2 px-3 py-1.5"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-white dark:bg-slate-800"
              borderClassName="border border-slate-200 dark:border-slate-700"
            >
              <Box layoutClassName="flex items-center gap-2">
                <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
                  {a.hours > 0 ? '+' : ''}{fmtHours(a.hours)}
                </Badge>
                <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">{fmtDay(a.workDate)}</Typography>
                {a.reason && (
                  <Typography as="span" size="xs" textClassName="text-slate-400">— {a.reason}</Typography>
                )}
              </Box>
              <IconButton label="Xoá bổ sung" size="sm" variant="ghost" onClick={() => onRemoveAdjust(a)}>
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AttendancePayrollPage;
