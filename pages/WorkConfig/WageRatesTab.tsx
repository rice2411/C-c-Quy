import React, { useMemo, useState } from 'react';
import { Plus, Trash2, History, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import DatePicker from '@/components/ui/DatePicker';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useWages, useWageMutations } from '@/hooks/queries/useWagesQuery';
import { useWorkShifts } from '@/hooks/queries/useShiftsQuery';
import { WageRate } from '@/types/wage';
import { formatVND } from '@/utils/format/currencyUtil';
import {
  WEEKDAYS,
  weekdayLabels,
  computeActive,
  effectiveRate,
  shiftHours,
  formatHours,
  todayISO,
  todayDow,
} from './workUtil';

/** Tab mức lương giờ theo vị trí + lịch sử + bảng liên hệ tiền công/ca. */
const WageRatesTab: React.FC = () => {
  const { wages, loading } = useWages();
  const { shifts } = useWorkShifts();
  const { addWage, deleteWage, adding } = useWageMutations();

  const [position, setPosition] = useState('');
  const [rate, setRate] = useState('');
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7]));
  const [effDate, setEffDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const today = todayISO();
  const dow = todayDow();

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, WageRate[]>();
    wages.forEach((w) => {
      if (!map.has(w.position)) {
        map.set(w.position, []);
        order.push(w.position);
      }
      map.get(w.position)!.push(w);
    });
    return order
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((pos) => ({ position: pos, rows: map.get(pos)!, active: computeActive(map.get(pos)!, today) }));
  }, [wages, today]);

  const activeShifts = useMemo(() => shifts.filter((s) => s.active), [shifts]);

  const toggleDay = (iso: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });

  const resetForm = () => {
    setPosition('');
    setRate('');
    setDays(new Set([1, 2, 3, 4, 5, 6, 7]));
    setEffDate(todayISO());
    setNote('');
  };

  const handleAdd = async () => {
    if (!position.trim()) return toast.error('Nhập vị trí.');
    if (!rate || Number(rate) <= 0) return toast.error('Nhập mức lương/giờ.');
    if (days.size === 0) return toast.error('Chọn ít nhất 1 thứ áp dụng.');
    try {
      await addWage({
        position: position.trim(),
        hourlyRate: Number(rate),
        weekdays: [...days].sort((a, b) => a - b),
        effectiveDate: effDate,
        note: note.trim() || null,
      });
      resetForm();
      toast.success('Đã thêm mức lương.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Thêm thất bại.');
    }
  };

  const handleDelete = async (w: WageRate) => {
    if (!window.confirm(`Xoá mức ${formatVND(w.hourlyRate)}/giờ (${w.position}) từ ${w.effectiveDate}?`)) return;
    try {
      await deleteWage(w.id);
      toast.success('Đã xoá.');
    } catch (err) {
      console.error(err);
      toast.error('Xoá thất bại.');
    }
  };

  return (
    <Box layoutClassName="flex flex-col gap-4">
      {/* Liên hệ: tiền công mỗi ca = số giờ ca × mức lương/giờ (ước tính hôm nay) */}
      {groups.length > 0 && activeShifts.length > 0 ? (
        <Card
          padding="none"
          layoutClassName="overflow-hidden"
          borderClassName="border border-primary-200 dark:border-primary-900/50"
          backgroundClassName="bg-primary-50/40 dark:bg-primary-900/10"
        >
          <Box layoutClassName="flex items-center gap-2 px-4 py-2.5" borderClassName="border-b border-primary-100 dark:border-primary-900/40">
            <Calculator className="h-4 w-4 text-primary-500" />
            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
              Tiền công mỗi ca (ước tính hôm nay)
            </Typography>
            <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
              = số giờ ca × mức lương/giờ theo mức hiện hành
            </Typography>
          </Box>
          <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead backgroundClassName="bg-white/60 dark:bg-slate-800/40">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-2 text-left">Vị trí</TableHeaderCell>
                  {activeShifts.map((s) => (
                    <TableHeaderCell key={s.code} layoutClassName="px-4 py-2 text-right">
                      {s.name} · {formatHours(shiftHours(s.startTime, s.endTime))}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map(({ position: pos, rows }) => {
                  const r = effectiveRate(rows, today, dow);
                  return (
                    <TableRow key={pos} borderClassName="border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                      <TableCell layoutClassName="whitespace-nowrap px-4 py-2">
                        <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">
                          {pos}
                        </Typography>
                        <Typography as="span" size="xs" layoutClassName="ml-2" textClassName="text-slate-400 dark:text-slate-500">
                          {r != null ? `${formatVND(r)}/giờ` : 'chưa có mức'}
                        </Typography>
                      </TableCell>
                      {activeShifts.map((s) => {
                        const pay = r != null ? Math.round(r * shiftHours(s.startTime, s.endTime)) : null;
                        return (
                          <TableCell key={s.code} layoutClassName="whitespace-nowrap px-4 py-2 text-right">
                            <Typography as="span" size="sm" layoutClassName="tabular-nums font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                              {pay != null ? formatVND(pay) : '—'}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : null}

      {/* Form thêm mức */}
      <Card
        padding="md"
        layoutClassName="p-4"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Vị trí" htmlFor="w-pos">
            <Input id="w-pos" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Thợ bánh, Bán hàng…" />
          </Field>
          <Field label="Mức lương / giờ (VND)" htmlFor="w-rate">
            <Input id="w-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="25000" />
          </Field>
          <Field label="Ngày áp dụng" htmlFor="w-date">
            <DatePicker id="w-date" value={effDate} onChange={setEffDate} fullWidth />
          </Field>
          <Field label="Ghi chú" htmlFor="w-note">
            <Input id="w-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd: tăng ca, cuối tuần…" />
          </Field>
        </Box>
        <Box layoutClassName="mt-3 flex flex-wrap items-end justify-between gap-3">
          <Field label="Áp dụng các thứ">
            <Box layoutClassName="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => {
                const on = days.has(w.iso);
                return (
                  <Button
                    key={w.iso}
                    type="button"
                    variant={on ? 'primary' : 'secondary'}
                    size="sm"
                    sizeClassName="h-8 w-10 px-0 text-xs"
                    onClick={() => toggleDay(w.iso)}
                  >
                    {w.label}
                  </Button>
                );
              })}
            </Box>
          </Field>
          <Button type="button" variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={adding} onClick={handleAdd}>
            {adding ? 'Đang thêm…' : 'Thêm mức lương'}
          </Button>
        </Box>
      </Card>

      {/* Danh sách theo vị trí */}
      {loading ? (
        <Box layoutClassName="flex items-center justify-center py-16">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : groups.length === 0 ? (
        <EmptyState icon={<History className="h-6 w-6" />} title="Chưa có mức lương nào. Thêm ở trên." />
      ) : (
        <Box layoutClassName="flex flex-col gap-4">
          {groups.map(({ position: pos, rows, active }) => (
            <Card
              key={pos}
              padding="none"
              layoutClassName="overflow-hidden"
              borderClassName="border border-slate-200 dark:border-slate-700"
              backgroundClassName="bg-white dark:bg-slate-800"
            >
              <Box
                layoutClassName="flex items-center justify-between gap-2 px-4 py-3"
                borderClassName="border-b border-slate-100 dark:border-slate-700"
                backgroundClassName="bg-slate-50/70 dark:bg-slate-700/40"
              >
                <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-slate-800 dark:text-white">
                  {pos}
                </Typography>
                <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-500 dark:text-slate-400">
                  <History className="mr-1 inline h-3 w-3" />
                  {rows.length} mốc
                </Badge>
              </Box>

              <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700/60">
                {rows.map((r) => {
                  const activeDays = active.get(r.id) ?? [];
                  const isActive = activeDays.length > 0;
                  const isFuture = r.effectiveDate > today;
                  return (
                    <Box key={r.id} layoutClassName="flex items-center gap-3 px-4 py-2.5">
                      <Box layoutClassName="min-w-0 flex-1">
                        <Box layoutClassName="flex flex-wrap items-center gap-2">
                          <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-slate-800 dark:text-slate-100">
                            {formatVND(r.hourlyRate)}/giờ
                          </Typography>
                          {isActive ? (
                            <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[11px] font-semibold" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20" textClassName="text-emerald-700 dark:text-emerald-300">
                              Đang áp dụng{activeDays.length < r.weekdays.length ? ` (${weekdayLabels(activeDays)})` : ''}
                            </Badge>
                          ) : isFuture ? (
                            <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[11px] font-semibold" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
                              Sắp áp dụng
                            </Badge>
                          ) : (
                            <Badge size="sm" layoutClassName="px-1.5 py-0.5 text-[11px]" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-400 dark:text-slate-500">
                              Đã thay
                            </Badge>
                          )}
                        </Box>
                        <Typography as="span" size="xs" layoutClassName="block" textClassName="text-slate-500 dark:text-slate-400">
                          Từ {r.effectiveDate} · {weekdayLabels(r.weekdays)}
                          {r.note ? ` · ${r.note}` : ''}
                        </Typography>
                      </Box>
                      <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => handleDelete(r)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default WageRatesTab;
