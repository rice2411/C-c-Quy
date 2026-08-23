import React from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
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
import { usePayroll } from '@/hooks/queries/useAttendanceQuery';
import {
  currentMonth,
  fmtHours,
  monthRange,
  shiftMonth,
  vnd,
} from './payrollUtil';

interface Props {
  month: string;
  onMonthChange: (m: string) => void;
  onPickEmployee: (employeeId: string) => void;
}

/** Bảng lương TỔNG mọi NV theo tháng (công/giờ/lương) + xuất Excel. Click 1 NV → mở Sổ công. */
const PayrollTab: React.FC<Props> = ({ month, onMonthChange, onPickEmployee }) => {
  const range = React.useMemo(() => monthRange(month), [month]);
  const { data: payroll, loading } = usePayroll(range, true);
  const employees = payroll?.employees ?? [];
  const th = 'px-4 py-3';

  const exportExcel = async () => {
    if (employees.length === 0) {
      toast.error('Chưa có dữ liệu để xuất.');
      return;
    }
    try {
      const XLSX = await import('xlsx-js-style');
      const header = [
        'Nhân viên', 'Vị trí', 'Ca đăng ký', 'Ca hợp lệ',
        'Tổng công', 'Giờ chấm', 'Giờ bổ sung', 'Tổng giờ', 'Lương (VND)',
      ];
      const body = employees.map((r) => [
        r.name, r.position ?? '', r.registeredShifts, r.validShifts,
        r.totalCong, r.workHours, r.adjHours, r.totalHours, Math.round(r.salary),
      ]);
      const total = ['TỔNG', '', '', '', '', '', '', payroll?.totalHours ?? 0, Math.round(payroll?.totalSalary ?? 0)];
      const ws = XLSX.utils.aoa_to_sheet([header, ...body, total]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BangLuong');
      XLSX.writeFile(wb, `bang-luong-${month}.xlsx`);
    } catch {
      toast.error('Xuất Excel thất bại.');
    }
  };

  return (
    <Box layoutClassName="flex flex-col gap-4">
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

      {/* Toolbar + bảng trong 1 container (giống Orders) */}
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
                  <TableRow
                    key={r.employeeId}
                    borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0"
                    layoutClassName="cursor-pointer"
                    hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    stateClassName="transition-colors"
                    onClick={() => onPickEmployee(r.employeeId)}
                  >
                    <TableCell layoutClassName={`${th} whitespace-nowrap`}>
                      <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-primary-600 dark:text-primary-400">{r.name}</Typography>
                    </TableCell>
                    <TableCell layoutClassName={`${th} whitespace-nowrap`}>
                      <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{r.position || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName={`${th} text-center whitespace-nowrap`}>
                      <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{r.registeredShifts}</Typography>
                    </TableCell>
                    <TableCell layoutClassName={`${th} text-center whitespace-nowrap`}>
                      <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-emerald-600 dark:text-emerald-400">{r.validShifts}</Typography>
                    </TableCell>
                    <TableCell layoutClassName={`${th} text-center whitespace-nowrap`}>
                      <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{r.totalCong}</Typography>
                    </TableCell>
                    <TableCell layoutClassName={`${th} text-center whitespace-nowrap`}>
                      <Box layoutClassName="inline-flex items-center gap-1">
                        <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{fmtHours(r.totalHours)}</Typography>
                        {r.adjHours !== 0 && (
                          <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[10px]" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
                            {r.adjHours > 0 ? '+' : ''}{fmtHours(r.adjHours)}
                          </Badge>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell layoutClassName={`${th} text-right whitespace-nowrap`}>
                      <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-primary-600 dark:text-primary-400">{vnd(r.salary)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default PayrollTab;
