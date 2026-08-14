import React, { useMemo, useState } from 'react';
import { Coins, Plus, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
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
import DatePicker from '@/components/ui/DatePicker';
import EmptyState from '@/components/ui/EmptyState';
import { useWages, useWageMutations } from '@/hooks/queries/useWagesQuery';
import { WageRate } from '@/types/wage';
import { formatVND } from '@/utils/format/currencyUtil';

const WEEKDAYS: { iso: number; label: string }[] = [
  { iso: 1, label: 'T2' },
  { iso: 2, label: 'T3' },
  { iso: 3, label: 'T4' },
  { iso: 4, label: 'T5' },
  { iso: 5, label: 'T6' },
  { iso: 6, label: 'T7' },
  { iso: 7, label: 'CN' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const weekdayLabels = (days: number[]) =>
  days.length === 7 ? 'Cả tuần' : WEEKDAYS.filter((w) => days.includes(w.iso)).map((w) => w.label).join(' · ');

/** Với mỗi vị trí, tính weekdays còn HIỆU LỰC cho từng bản ghi (mới đè cũ, chỉ tính bản đã tới ngày). */
const computeActive = (rows: WageRate[], today: string): Map<string, number[]> => {
  const sorted = [...rows].sort(
    (a, b) =>
      b.effectiveDate.localeCompare(a.effectiveDate) ||
      (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );
  const covered = new Set<number>();
  const map = new Map<string, number[]>();
  for (const r of sorted) {
    if (r.effectiveDate > today) continue; // chưa tới ngày áp dụng
    const active = r.weekdays.filter((d) => !covered.has(d));
    active.forEach((d) => covered.add(d));
    map.set(r.id, active);
  }
  return map;
};

const WagesPage: React.FC = () => {
  const { wages, loading } = useWages();
  const { addWage, deleteWage, adding } = useWageMutations();

  const [position, setPosition] = useState('');
  const [rate, setRate] = useState('');
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7]));
  const [effDate, setEffDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const today = todayISO();

  // Gom theo vị trí (giữ thứ tự tên).
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, WageRate[]>();
    wages.forEach((w) => {
      const key = w.position;
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(w);
    });
    return order
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((pos) => ({ position: pos, rows: map.get(pos)!, active: computeActive(map.get(pos)!, today) }));
  }, [wages, today]);

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
    if (!position.trim()) {
      toast.error('Nhập vị trí.');
      return;
    }
    if (!rate || Number(rate) <= 0) {
      toast.error('Nhập mức lương/giờ.');
      return;
    }
    if (days.size === 0) {
      toast.error('Chọn ít nhất 1 thứ áp dụng.');
      return;
    }
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
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Mức lương giờ
        </Heading>
      </Box>

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
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={adding}
            onClick={handleAdd}
          >
            {adding ? 'Đang thêm…' : 'Thêm mức lương'}
          </Button>
        </Box>
      </Card>

      {/* Danh sách theo vị trí */}
      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : groups.length === 0 ? (
        <EmptyState icon={<Coins className="h-6 w-6" />} title="Chưa có mức lương nào. Thêm ở trên." />
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
                <Badge
                  size="sm"
                  layoutClassName="px-2 py-0.5 text-xs"
                  backgroundClassName="bg-slate-100 dark:bg-slate-700"
                  textClassName="text-slate-500 dark:text-slate-400"
                >
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

export default WagesPage;
