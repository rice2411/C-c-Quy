import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useWorkShifts, useSaveShifts } from '@/hooks/queries/useShiftsQuery';
import { WorkShift } from '@/types/shift';
import { shiftAccent } from './shiftStyle';
import { shiftHours, formatHours } from './workUtil';

/** T2..CN theo ISO dow. */
const WEEKDAYS: { iso: number; label: string }[] = [
  { iso: 1, label: 'T2' },
  { iso: 2, label: 'T3' },
  { iso: 3, label: 'T4' },
  { iso: 4, label: 'T5' },
  { iso: 5, label: 'T6' },
  { iso: 6, label: 'T7' },
  { iso: 7, label: 'CN' },
];

/** Tab cài đặt ca: giờ + thứ áp dụng + số giờ mỗi ca (liên hệ với lương). */
const ShiftSettingsTab: React.FC = () => {
  const { shifts, loading } = useWorkShifts();
  const { saveShifts, saving } = useSaveShifts();
  const [draft, setDraft] = useState<WorkShift[]>([]);

  useEffect(() => {
    if (shifts.length) setDraft(shifts.map((s) => ({ ...s, weekdays: [...s.weekdays] })));
  }, [shifts]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(shifts), [draft, shifts]);

  const patch = (code: string, p: Partial<WorkShift>) =>
    setDraft((prev) => prev.map((s) => (s.code === code ? { ...s, ...p } : s)));

  const toggleDay = (code: string, iso: number) =>
    setDraft((prev) =>
      prev.map((s) => {
        if (s.code !== code) return s;
        const has = s.weekdays.includes(iso);
        const weekdays = has ? s.weekdays.filter((d) => d !== iso) : [...s.weekdays, iso].sort((a, b) => a - b);
        return { ...s, weekdays };
      }),
    );

  const handleSave = async () => {
    try {
      await saveShifts(
        draft.map((s) => ({
          code: s.code,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          weekdays: s.weekdays,
          congFactor: s.congFactor,
          sortOrder: s.sortOrder,
          active: s.active,
        })),
      );
      toast.success('Đã lưu cài đặt ca.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại.');
    }
  };

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center py-16">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="flex flex-col gap-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
        <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
          Giờ làm + thứ áp dụng cho mỗi ca. Số giờ mỗi ca dùng để tính tiền công (giờ × mức lương/giờ).
        </Typography>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} disabled={!dirty || saving} onClick={handleSave}>
          {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
        </Button>
      </Box>

      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {draft.map((s) => {
          const accent = shiftAccent(s.sortOrder);
          const hrs = shiftHours(s.startTime, s.endTime);
          return (
            <Card
              key={s.code}
              padding="md"
              layoutClassName="flex flex-col gap-4 p-4"
              borderClassName="border border-slate-200 dark:border-slate-700"
              backgroundClassName="bg-white dark:bg-slate-800"
            >
              <Box layoutClassName="flex items-center gap-2">
                <Box layoutClassName="h-3 w-3 shrink-0 rounded-full" backgroundClassName={accent.dotClassName} />
                <Input value={s.name} onChange={(e) => patch(s.code, { name: e.target.value })} placeholder="Tên ca" containerClassName="flex-1" />
                <Switch checked={s.active} onCheckedChange={(v) => patch(s.code, { active: v })} />
              </Box>

              <Box layoutClassName="grid grid-cols-2 gap-3">
                <Field label="Bắt đầu" htmlFor={`start-${s.code}`}>
                  <Input id={`start-${s.code}`} type="time" value={s.startTime} onChange={(e) => patch(s.code, { startTime: e.target.value })} />
                </Field>
                <Field label="Kết thúc" htmlFor={`end-${s.code}`}>
                  <Input id={`end-${s.code}`} type="time" value={s.endTime} onChange={(e) => patch(s.code, { endTime: e.target.value })} />
                </Field>
              </Box>

              <Box layoutClassName="flex items-center gap-2">
                <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                  Số giờ / ca:
                </Typography>
                <Badge
                  size="sm"
                  layoutClassName="px-2 py-0.5 text-xs font-semibold"
                  backgroundClassName={accent.softBgClassName}
                  textClassName={accent.textClassName}
                >
                  {formatHours(hrs)}
                </Badge>
              </Box>

              <Field label="Áp dụng các thứ">
                <Box layoutClassName="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((w) => {
                    const on = s.weekdays.includes(w.iso);
                    return (
                      <Button
                        key={w.iso}
                        type="button"
                        variant={on ? 'primary' : 'secondary'}
                        size="sm"
                        sizeClassName="h-8 w-10 px-0 text-xs"
                        onClick={() => toggleDay(s.code, w.iso)}
                      >
                        {w.label}
                      </Button>
                    );
                  })}
                </Box>
              </Field>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default ShiftSettingsTab;
