import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { useEmployees } from '@/hooks/queries/useEmployeesQuery';
import {
  useWorkShifts,
  useShiftAssignments,
  useShiftMutations,
} from '@/hooks/queries/useShiftsQuery';
import { ShiftAssignment } from '@/types/shift';
import DayAssignPanel from './components/DayAssignPanel';
import {
  MONTH_LABELS_VI,
  WEEKDAY_LABELS,
  monthMatrix,
  toISO,
} from './dateUtil';
import { shiftAccent } from './shiftStyle';

const ShiftsPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { shifts, loading: shiftsLoading } = useWorkShifts();
  const { employees, loading: empLoading } = useEmployees();
  const { setDay, setDayPending } = useShiftMutations();

  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const rangeFrom = toISO(weeks[0][0]);
  const rangeTo = toISO(weeks[5][6]);
  const { assignments, loading: assignLoading } = useShiftAssignments(rangeFrom, rangeTo);

  const todayISO = toISO(today);

  // NV đang làm → option cho multi-select.
  const employeeOptions = useMemo<DropdownOption[]>(
    () =>
      employees
        .filter((e) => e.status === 'active')
        .map((e) => ({ value: e.id, label: e.name })),
    [employees],
  );

  // Gom phân ca theo 'yyyy-mm-dd|shiftCode'.
  const byKey = useMemo(() => {
    const m = new Map<string, ShiftAssignment[]>();
    assignments.forEach((a) => {
      const k = `${a.workDate}|${a.shiftCode}`;
      const arr = m.get(k);
      if (arr) arr.push(a);
      else m.set(k, [a]);
    });
    return m;
  }, [assignments]);

  // Phân ca của ngày đang chọn, gom theo shiftCode (cho panel).
  const selectedByShift = useMemo(() => {
    const map: Record<string, ShiftAssignment[]> = {};
    if (!selectedDate) return map;
    shifts.forEach((s) => {
      map[s.code] = byKey.get(`${selectedDate}|${s.code}`) ?? [];
    });
    return map;
  }, [selectedDate, shifts, byKey]);

  const goMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () =>
    setCursor({ year: today.getFullYear(), month: today.getMonth() });

  const handleSetDay = async (shiftCode: string, employeeIds: string[]) => {
    if (!selectedDate) return;
    try {
      await setDay({ workDate: selectedDate, shiftCode, employeeIds });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Lưu ca thất bại.');
    }
  };

  const loading = shiftsLoading || empLoading;

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            Lịch ca làm
          </Heading>
          {assignLoading ? <Spinner size="sm" textClassName="text-primary-400" /> : null}
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>
            Hôm nay
          </Button>
          <Box layoutClassName="flex items-center gap-1">
            <IconButton label="Tháng trước" size="sm" variant="ghost" onClick={() => goMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Typography as="span" size="sm" layoutClassName="w-28 text-center font-semibold" textClassName="text-slate-700 dark:text-slate-200">
              {MONTH_LABELS_VI[cursor.month]} {cursor.year}
            </Typography>
            <IconButton label="Tháng sau" size="sm" variant="ghost" onClick={() => goMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Chú thích ca */}
      <Box layoutClassName="flex flex-wrap items-center gap-3">
        {shifts.map((s) => {
          const accent = shiftAccent(s.sortOrder);
          return (
            <Box key={s.code} layoutClassName="flex items-center gap-1.5">
              <Box layoutClassName="h-2.5 w-2.5 rounded-full" backgroundClassName={accent.dotClassName} />
              <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">
                {s.name}
              </Typography>
              <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-400 dark:text-slate-500">
                {s.startTime}–{s.endTime}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : (
        <Card
          padding="none"
          layoutClassName="flex-1 overflow-hidden"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          <Box layoutClassName="overflow-x-auto">
            <Box layoutClassName="min-w-[760px]">
              {/* Header thứ */}
              <Box layoutClassName="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
                {WEEKDAY_LABELS.map((w) => (
                  <Typography
                    key={w}
                    as="div"
                    size="xs"
                    layoutClassName="px-2 py-2 text-center font-semibold uppercase tracking-wide"
                    textClassName="text-slate-500 dark:text-slate-400"
                  >
                    {w}
                  </Typography>
                ))}
              </Box>

              {/* 6 tuần */}
              {weeks.map((week, wi) => (
                <Box key={wi} layoutClassName="grid grid-cols-7">
                  {week.map((d) => {
                    const iso = toISO(d);
                    const inMonth = d.getMonth() === cursor.month;
                    const isToday = iso === todayISO;
                    return (
                      <Box
                        key={iso}
                        role="button"
                        onClick={() => setSelectedDate(iso)}
                        layoutClassName="flex min-h-[92px] cursor-pointer flex-col gap-1 p-1.5"
                        borderClassName="border-b border-r border-slate-100 dark:border-slate-700/60"
                        backgroundClassName={inMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/60 dark:bg-slate-900/30'}
                        hoverClassName="hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
                      >
                        <Box layoutClassName="flex items-center justify-between">
                          <Typography
                            as="span"
                            size="xs"
                            layoutClassName={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold ${isToday ? '' : ''}`}
                            backgroundClassName={isToday ? 'bg-primary-500' : ''}
                            textClassName={
                              isToday
                                ? 'text-white'
                                : inMonth
                                  ? 'text-slate-700 dark:text-slate-200'
                                  : 'text-slate-400 dark:text-slate-600'
                            }
                          >
                            {d.getDate()}
                          </Typography>
                        </Box>

                        {/* 3 ca */}
                        <Box layoutClassName="flex flex-col gap-0.5">
                          {shifts.map((s) => {
                            const accent = shiftAccent(s.sortOrder);
                            const list = byKey.get(`${iso}|${s.code}`) ?? [];
                            const n = list.length;
                            return (
                              <Box
                                key={s.code}
                                layoutClassName="flex items-center gap-1 rounded px-1 py-0.5"
                                backgroundClassName={n > 0 ? accent.softBgClassName : ''}
                              >
                                <Box layoutClassName="h-1.5 w-1.5 shrink-0 rounded-full" backgroundClassName={accent.dotClassName} />
                                <Typography
                                  as="span"
                                  size="xs"
                                  layoutClassName="min-w-0 flex-1 truncate text-[11px]"
                                  textClassName={n > 0 ? accent.textClassName : 'text-slate-300 dark:text-slate-600'}
                                >
                                  {n > 0
                                    ? (list[0]?.employeeName ?? '') + (n > 1 ? ` +${n - 1}` : '')
                                    : '—'}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      )}

      <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
        Bấm vào 1 ngày để xếp nhân viên vào từng ca. Đối chiếu công thực (chấm công) &amp; lương sẽ bổ sung ở bước sau.
      </Typography>

      <DayAssignPanel
        open={!!selectedDate}
        date={selectedDate}
        shifts={shifts}
        employeeOptions={employeeOptions}
        assignmentsByShift={selectedByShift}
        onClose={() => setSelectedDate(null)}
        onSetDay={handleSetDay}
        pending={setDayPending}
      />
    </Box>
  );
};

export default ShiftsPage;
