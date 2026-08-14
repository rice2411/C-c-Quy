import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { ShiftAssignment, WorkShift } from '@/types/shift';
import { formatDateLabel } from '../dateUtil';
import { shiftAccent } from '../shiftStyle';

interface Props {
  open: boolean;
  date: string | null; // yyyy-mm-dd
  shifts: WorkShift[];
  employeeOptions: DropdownOption[];
  /** phân ca của NGÀY này, gom theo shiftCode. */
  assignmentsByShift: Record<string, ShiftAssignment[]>;
  onClose: () => void;
  onSetDay: (shiftCode: string, employeeIds: string[]) => Promise<void>;
  pending?: boolean;
}

/** Panel xếp ca cho 1 ngày: mỗi ca 1 ô multi-select nhân viên. */
const DayAssignPanel: React.FC<Props> = ({
  open,
  date,
  shifts,
  employeeOptions,
  assignmentsByShift,
  onClose,
  onSetDay,
  pending,
}) => {
  // Lựa chọn cục bộ để phản hồi tức thì; đồng bộ lại mỗi khi mở ngày khác.
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const initial = useMemo(() => {
    const map: Record<string, string[]> = {};
    shifts.forEach((s) => {
      map[s.code] = (assignmentsByShift[s.code] ?? []).map((a) => a.employeeId);
    });
    return map;
  }, [shifts, assignmentsByShift]);

  useEffect(() => {
    setSelected(initial);
  }, [initial, date]);

  const handleChange = (shiftCode: string, ids: string[]) => {
    setSelected((prev) => ({ ...prev, [shiftCode]: ids }));
    void onSetDay(shiftCode, ids);
  };

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    employeeOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [employeeOptions]);

  return (
    <BaseSlidePanel
      isOpen={open}
      onClose={onClose}
      title={date ? `Xếp ca · ${formatDateLabel(date)}` : 'Xếp ca'}
      maxWidth="md"
      footer={
        <Box layoutClassName="flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Xong
          </Button>
        </Box>
      }
    >
      <Box layoutClassName="space-y-5 p-4 sm:p-6">
        <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
          Chọn nhân viên cho từng ca. Lưu tự động khi thay đổi.
        </Typography>

        {shifts.map((s) => {
          const accent = shiftAccent(s.sortOrder);
          const ids = selected[s.code] ?? [];
          return (
            <Box key={s.code} layoutClassName="space-y-2">
              <Field
                label={
                  <Box layoutClassName="flex items-center gap-2">
                    <Box
                      layoutClassName="h-2.5 w-2.5 shrink-0 rounded-full"
                      backgroundClassName={accent.dotClassName}
                    />
                    <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                      {s.name}
                    </Typography>
                    <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-400 dark:text-slate-500">
                      {s.startTime}–{s.endTime}
                    </Typography>
                    <Badge
                      size="sm"
                      layoutClassName="ml-auto px-1.5 py-0.5 text-[11px] font-semibold"
                      backgroundClassName={accent.softBgClassName}
                      textClassName={accent.textClassName}
                    >
                      {ids.length} NV
                    </Badge>
                  </Box>
                }
              >
                <Dropdown
                  multiple
                  value={ids}
                  onChange={(v) => handleChange(s.code, v)}
                  options={employeeOptions}
                  searchable
                  placeholder="Chọn nhân viên…"
                  disabled={pending || employeeOptions.length === 0}
                />
              </Field>

              {ids.length > 0 ? (
                <Box layoutClassName="flex flex-wrap gap-1.5">
                  {ids.map((id) => (
                    <Badge
                      key={id}
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-xs"
                      backgroundClassName="bg-slate-100 dark:bg-slate-700"
                      textClassName="text-slate-600 dark:text-slate-300"
                    >
                      {nameById.get(id) ?? id}
                    </Badge>
                  ))}
                </Box>
              ) : (
                <Box layoutClassName="flex items-center gap-1.5 pl-0.5">
                  <Users className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                    Chưa xếp ai
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}

        {employeeOptions.length === 0 ? (
          <Typography size="xs" variant="danger">
            Chưa có nhân viên đang làm. Thêm nhân viên ở trang Nhân viên trước.
          </Typography>
        ) : null}
      </Box>
    </BaseSlidePanel>
  );
};

export default DayAssignPanel;
