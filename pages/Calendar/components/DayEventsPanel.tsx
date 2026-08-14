import React, { useMemo, useState } from 'react';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Field from '@/components/ui/Field';
import EmptyState from '@/components/ui/EmptyState';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { CalendarEvent, CustomEventInput } from '@/types/calendar';
import { formatDateLabel } from '../dateUtil';
import { eventAccent } from '../eventStyle';

interface Props {
  open: boolean;
  date: string | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSaveCustom: (input: CustomEventInput) => Promise<void>;
  onDeleteCustom: (id: string) => Promise<void>;
  saving?: boolean;
}

/** Panel: liệt kê mọi event của 1 ngày + thêm/xoá sự kiện tự thêm. */
const DayEventsPanel: React.FC<Props> = ({
  open,
  date,
  events,
  onClose,
  onSaveCustom,
  onDeleteCustom,
  saving,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99')),
    [events],
  );

  const resetForm = () => {
    setTitle('');
    setTime('');
    setNote('');
  };

  const handleAdd = async () => {
    if (!date) return;
    if (!title.trim()) {
      toast.error('Nhập tiêu đề sự kiện.');
      return;
    }
    try {
      await onSaveCustom({
        title: title.trim(),
        eventDate: date,
        startTime: time || null,
        note: note.trim() || null,
      });
      resetForm();
      toast.success('Đã thêm sự kiện.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Thêm thất bại.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteCustom(id);
      toast.success('Đã xoá sự kiện.');
    } catch (err) {
      console.error(err);
      toast.error('Xoá thất bại.');
    }
  };

  return (
    <BaseSlidePanel
      isOpen={open}
      onClose={onClose}
      title={date ? formatDateLabel(date) : 'Lịch'}
      maxWidth="md"
    >
      <Box layoutClassName="space-y-5 p-4 sm:p-6">
        {/* Danh sách event */}
        {sorted.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="Ngày này chưa có gì." />
        ) : (
          <Box layoutClassName="space-y-1.5">
            {sorted.map((ev) => {
              const accent = eventAccent(ev);
              return (
                <Box
                  key={ev.id}
                  layoutClassName="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                  backgroundClassName={accent.softBgClassName}
                >
                  <Box layoutClassName="h-2 w-2 shrink-0 rounded-full" backgroundClassName={accent.dotClassName} />
                  <Box layoutClassName="min-w-0 flex-1">
                    <Box layoutClassName="flex items-center gap-2">
                      <Typography as="span" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">
                        {ev.title}
                      </Typography>
                      {ev.time ? (
                        <Typography as="span" size="xs" layoutClassName="shrink-0 font-mono" textClassName={accent.textClassName}>
                          {ev.time}
                        </Typography>
                      ) : null}
                    </Box>
                    {ev.subtitle ? (
                      <Typography as="span" size="xs" layoutClassName="block truncate" textClassName="text-slate-500 dark:text-slate-400">
                        {ev.subtitle}
                      </Typography>
                    ) : null}
                  </Box>
                  {ev.type === 'custom' ? (
                    <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => handleDelete(ev.id)}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </IconButton>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Thêm sự kiện tự thêm */}
        <Box
          layoutClassName="space-y-3 rounded-xl p-3"
          borderClassName="border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400 dark:text-slate-500">
            Thêm sự kiện
          </Typography>
          <Box layoutClassName="grid grid-cols-3 gap-2">
            <Box layoutClassName="col-span-2">
              <Field label="Tiêu đề" htmlFor="ce-title">
                <Input id="ce-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập nguyên liệu, nghỉ lễ…" />
              </Field>
            </Box>
            <Field label="Giờ" htmlFor="ce-time">
              <Input id="ce-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </Box>
          <Field label="Ghi chú" htmlFor="ce-note">
            <Textarea id="ce-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Tuỳ chọn…" />
          </Field>
          <Box layoutClassName="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={saving}
              onClick={handleAdd}
            >
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </Box>
        </Box>
      </Box>
    </BaseSlidePanel>
  );
};

export default DayEventsPanel;
