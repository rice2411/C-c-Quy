import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Spinner from '@/components/ui/Spinner';
import {
  useCalendarEvents,
  useCalendarMutations,
} from '@/hooks/queries/useCalendarQuery';
import { CalendarEvent } from '@/types/calendar';
import DayEventsPanel from './components/DayEventsPanel';
import { MONTH_LABELS_VI, WEEKDAY_LABELS, monthMatrix, toISO } from './dateUtil';
import { eventAccent } from './eventStyle';

type ViewMode = 'month' | 'week';

/** Ngày local (tránh lệch tz). */
const mkDate = (d: Date, plusDays = 0): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + plusDays);
/** Thứ 2 của tuần chứa d (tuần bắt đầu T2). */
const startOfWeek = (d: Date): Date => mkDate(d, -((d.getDay() + 6) % 7));

const ShiftsCalendarPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weeks = useMemo(() => monthMatrix(anchor.getFullYear(), anchor.getMonth()), [anchor]);
  const weekDays = useMemo(() => {
    const s = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => mkDate(s, i));
  }, [anchor]);

  const rangeFrom = toISO(view === 'month' ? weeks[0][0] : weekDays[0]);
  const rangeTo = toISO(view === 'month' ? weeks[5][6] : weekDays[6]);
  const { events, loading } = useCalendarEvents(rangeFrom, rangeTo);
  const { saveCustom, deleteCustom, saving } = useCalendarMutations();

  const todayISO = toISO(today);

  // TẠM THỜI: lịch chỉ hiển thị đăng ký ca (event type 'shift'); ẩn order/custom/attendance.
  const allByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.filter((e) => e.type === 'shift').forEach((e) => {
      const arr = m.get(e.date);
      if (arr) arr.push(e);
      else m.set(e.date, [e]);
    });
    return m;
  }, [events]);

  const go = (delta: number) =>
    setAnchor((a) =>
      view === 'month' ? new Date(a.getFullYear(), a.getMonth() + delta, 1) : mkDate(a, delta * 7),
    );

  const headerLabel =
    view === 'month'
      ? `${MONTH_LABELS_VI[anchor.getMonth()]} ${anchor.getFullYear()}`
      : `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}`;

  const selectedEvents = selectedDate ? allByDate.get(selectedDate) ?? [] : [];

  const viewBtn = (mode: ViewMode, label: string) => (
    <Button
      type="button"
      onClick={() => setView(mode)}
      variant={view === mode ? 'primary' : 'secondary'}
      sizeClassName="px-3 py-1.5 text-sm"
      roundedClassName="rounded-lg"
      borderClassName={view === mode ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={view === mode ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={view === mode ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
      disableVariantHover
      disableVariantTextColor
    >
      {label}
    </Button>
  );

  /** 1 chip event (tên NV · ca). */
  const eventChip = (ev: CalendarEvent) => {
    const accent = eventAccent(ev);
    return (
      <Box
        key={ev.id}
        layoutClassName="flex items-center gap-1 rounded px-1 py-0.5"
        backgroundClassName={accent.softBgClassName}
      >
        <Box layoutClassName="h-1.5 w-1.5 shrink-0 rounded-full" backgroundClassName={accent.dotClassName} />
        <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate text-[11px]" textClassName={accent.textClassName}>
          {ev.time ? `${ev.time} ` : ''}{ev.title}
        </Typography>
      </Box>
    );
  };

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            Lịch đăng ký ca
          </Heading>
          {loading ? <Spinner size="sm" textClassName="text-primary-400" /> : null}
        </Box>
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          {viewBtn('week', 'Tuần')}
          {viewBtn('month', 'Tháng')}
          <Button type="button" variant="secondary" size="sm" onClick={() => setAnchor(new Date())}>
            Hôm nay
          </Button>
          <Box layoutClassName="flex items-center gap-1">
            <IconButton label={view === 'month' ? 'Tháng trước' : 'Tuần trước'} size="sm" variant="ghost" onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Typography as="span" size="sm" layoutClassName="w-32 text-center font-semibold" textClassName="text-slate-700 dark:text-slate-200">
              {headerLabel}
            </Typography>
            <IconButton label={view === 'month' ? 'Tháng sau' : 'Tuần sau'} size="sm" variant="ghost" onClick={() => go(1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Calendar */}
      <Card
        padding="none"
        layoutClassName="flex-1 overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="h-full overflow-auto">
          <Box layoutClassName="min-w-[820px]">
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

            {view === 'month' ? (
              weeks.map((week, wi) => (
                <Box key={wi} layoutClassName="grid grid-cols-7">
                  {week.map((d) => {
                    const iso = toISO(d);
                    const inMonth = d.getMonth() === anchor.getMonth();
                    const isToday = iso === todayISO;
                    const dayEvents = allByDate.get(iso) ?? [];
                    const shown = dayEvents.slice(0, 3);
                    const extra = dayEvents.length - shown.length;
                    return (
                      <Box
                        key={iso}
                        role="button"
                        onClick={() => setSelectedDate(iso)}
                        layoutClassName="flex min-h-[104px] cursor-pointer flex-col gap-1 p-1.5"
                        borderClassName="border-b border-r border-slate-100 dark:border-slate-700/60"
                        backgroundClassName={inMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/60 dark:bg-slate-900/30'}
                        hoverClassName="hover:bg-primary-50/40 dark:hover:bg-primary-900/10"
                      >
                        <Typography
                          as="span"
                          size="xs"
                          layoutClassName="inline-flex h-5 min-w-5 items-center justify-center self-start rounded-full px-1 font-semibold"
                          backgroundClassName={isToday ? 'bg-primary-500' : ''}
                          textClassName={isToday ? 'text-white' : inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}
                        >
                          {d.getDate()}
                        </Typography>
                        <Box layoutClassName="flex flex-col gap-0.5">
                          {shown.map(eventChip)}
                          {extra > 0 ? (
                            <Typography as="span" size="xs" layoutClassName="pl-1 text-[11px]" textClassName="text-slate-400 dark:text-slate-500">
                              +{extra} nữa
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ))
            ) : (
              <Box layoutClassName="grid grid-cols-7">
                {weekDays.map((d) => {
                  const iso = toISO(d);
                  const isToday = iso === todayISO;
                  const dayEvents = allByDate.get(iso) ?? [];
                  return (
                    <Box
                      key={iso}
                      role="button"
                      onClick={() => setSelectedDate(iso)}
                      layoutClassName="flex min-h-[60vh] cursor-pointer flex-col gap-1 p-2"
                      borderClassName="border-b border-r border-slate-100 dark:border-slate-700/60"
                      backgroundClassName="bg-white dark:bg-slate-800"
                      hoverClassName="hover:bg-primary-50/40 dark:hover:bg-primary-900/10"
                    >
                      <Typography
                        as="span"
                        size="sm"
                        layoutClassName="inline-flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1.5 font-semibold"
                        backgroundClassName={isToday ? 'bg-primary-500' : ''}
                        textClassName={isToday ? 'text-white' : 'text-slate-700 dark:text-slate-200'}
                      >
                        {d.getDate()}
                      </Typography>
                      <Box layoutClassName="flex flex-col gap-1">
                        {dayEvents.length === 0 ? (
                          <Typography as="span" size="xs" variant="muted" layoutClassName="pl-0.5">—</Typography>
                        ) : (
                          dayEvents.map(eventChip)
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      <DayEventsPanel
        open={!!selectedDate}
        date={selectedDate}
        events={selectedEvents}
        onClose={() => setSelectedDate(null)}
        onSaveCustom={saveCustom}
        onDeleteCustom={deleteCustom}
        saving={saving}
      />
    </Box>
  );
};

export default ShiftsCalendarPage;
