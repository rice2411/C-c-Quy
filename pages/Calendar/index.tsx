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
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import DayEventsPanel from './components/DayEventsPanel';
import { MONTH_LABELS_VI, WEEKDAY_LABELS, monthMatrix, toISO } from './dateUtil';
import { eventAccent, TYPE_LABELS } from './eventStyle';

const ALL_TYPES: CalendarEventType[] = ['order', 'shift', 'custom', 'attendance'];

const ShiftsCalendarPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<CalendarEventType>>(new Set(ALL_TYPES));

  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const rangeFrom = toISO(weeks[0][0]);
  const rangeTo = toISO(weeks[5][6]);
  const { events, loading } = useCalendarEvents(rangeFrom, rangeTo);
  const { saveCustom, deleteCustom, saving } = useCalendarMutations();

  const todayISO = toISO(today);

  // Gom TẤT CẢ event theo ngày (panel dùng bản đầy đủ).
  const allByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const arr = m.get(e.date);
      if (arr) arr.push(e);
      else m.set(e.date, [e]);
    });
    return m;
  }, [events]);

  const goMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const toggleType = (t: CalendarEventType) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const selectedEvents = selectedDate ? allByDate.get(selectedDate) ?? [] : [];

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            Lịch
          </Heading>
          {loading ? <Spinner size="sm" textClassName="text-primary-400" /> : null}
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
          >
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

      {/* Lọc theo loại */}
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        {TYPE_LABELS.map((t) => {
          const on = visible.has(t.type);
          return (
            <Button
              key={t.type}
              type="button"
              variant={on ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleType(t.type)}
            >
              <Box layoutClassName="flex items-center gap-1.5">
                <Box
                  layoutClassName="h-2.5 w-2.5 rounded-full"
                  backgroundClassName={on ? t.dotClassName : 'bg-slate-300 dark:bg-slate-600'}
                />
                <Typography
                  as="span"
                  size="xs"
                  textClassName={on ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}
                >
                  {t.label}
                </Typography>
              </Box>
            </Button>
          );
        })}
      </Box>

      {/* Calendar */}
      <Card
        padding="none"
        layoutClassName="flex-1 overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="overflow-x-auto">
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

            {weeks.map((week, wi) => (
              <Box key={wi} layoutClassName="grid grid-cols-7">
                {week.map((d) => {
                  const iso = toISO(d);
                  const inMonth = d.getMonth() === cursor.month;
                  const isToday = iso === todayISO;
                  const dayEvents = (allByDate.get(iso) ?? []).filter((e) => visible.has(e.type));
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

                      <Box layoutClassName="flex flex-col gap-0.5">
                        {shown.map((ev) => {
                          const accent = eventAccent(ev);
                          return (
                            <Box
                              key={ev.id}
                              layoutClassName="flex items-center gap-1 rounded px-1 py-0.5"
                              backgroundClassName={accent.softBgClassName}
                            >
                              <Box layoutClassName="h-1.5 w-1.5 shrink-0 rounded-full" backgroundClassName={accent.dotClassName} />
                              <Typography
                                as="span"
                                size="xs"
                                layoutClassName="min-w-0 flex-1 truncate text-[11px]"
                                textClassName={accent.textClassName}
                              >
                                {ev.time ? `${ev.time} ` : ''}{ev.title}
                              </Typography>
                            </Box>
                          );
                        })}
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
            ))}
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
