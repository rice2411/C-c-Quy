import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Coins, Plus, Trash2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useEmployeeWages, useEmployeeWageMutations } from '@/hooks/queries/useEmployeesQuery';

const pad2 = (n: number) => String(n).padStart(2, '0');
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const vnd = (n: number): string => `${Math.round(n).toLocaleString('vi-VN')}đ`;
const fmtDay = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/** Quản lý mức lương/giờ (deal riêng) của 1 NV: mức hiện tại + lịch sử + thêm mức mới. */
const WageSection: React.FC<{ employeeId: string | null }> = ({ employeeId }) => {
  const { wages, loading } = useEmployeeWages(employeeId);
  const { addWage, deleteWage } = useEmployeeWageMutations();

  const [rate, setRate] = useState('');
  const [effDate, setEffDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Mức ĐANG áp dụng = bản ghi mới nhất có ngày áp dụng <= hôm nay.
  const current = useMemo(() => {
    const today = todayISO();
    return wages.find((w) => w.effectiveDate <= today) ?? null;
  }, [wages]);

  const submit = async () => {
    if (!employeeId) return;
    const r = Number(rate);
    if (!Number.isFinite(r) || r <= 0) {
      toast.error('Nhập mức lương/giờ hợp lệ.');
      return;
    }
    if (!effDate) {
      toast.error('Chọn ngày áp dụng.');
      return;
    }
    setSaving(true);
    try {
      await addWage({ employeeId, hourlyRate: r, effectiveDate: effDate, note: note.trim() || null });
      toast.success(`Đã đặt mức ${vnd(r)}/giờ từ ${fmtDay(effDate)}.`);
      setRate('');
      setNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu mức lương thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, r: number) => {
    if (!window.confirm(`Xoá mức ${vnd(r)}/giờ?`)) return;
    try {
      await deleteWage(id);
      toast.success('Đã xoá mức lương.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  return (
    <Box
      layoutClassName="flex flex-col gap-3 p-4"
      roundedClassName="rounded-xl"
      borderClassName="border border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-slate-50 dark:bg-slate-800/40"
    >
      <Box layoutClassName="flex items-center gap-2">
        <Coins className="h-4 w-4 text-primary-500" />
        <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
          Mức lương/giờ (deal riêng)
        </Typography>
        {current ? (
          <Badge size="sm" layoutClassName="ml-auto px-2 py-0.5 text-xs font-semibold" backgroundClassName="bg-primary-50 dark:bg-primary-900/20" textClassName="text-primary-700 dark:text-primary-300">
            Hiện tại: {vnd(current.hourlyRate)}/giờ
          </Badge>
        ) : (
          <Badge size="sm" layoutClassName="ml-auto px-2 py-0.5 text-xs" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">
            chưa đặt mức
          </Badge>
        )}
      </Box>

      {!employeeId ? (
        <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
          Lưu nhân viên trước, rồi mở lại để đặt mức lương/giờ.
        </Typography>
      ) : (
        <>
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Vị trí chỉ là nhãn — mỗi NV có mức riêng. Đổi mức = thêm mốc mới; lương tháng cũ giữ mức cũ.
          </Typography>

          {/* Form thêm mức */}
          <Box layoutClassName="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Mức lương/giờ (VND)" htmlFor="wage-rate">
              <Input id="wage-rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="25000" />
            </Field>
            <Field label="Áp dụng từ" htmlFor="wage-date">
              <Input id="wage-date" type="date" value={effDate} onChange={(e) => setEffDate(e.target.value)} />
            </Field>
            <Button type="button" variant="primary" size="sm" disabled={saving} leftIcon={<Plus className="h-4 w-4" />} onClick={submit}>
              Lưu mức
            </Button>
          </Box>
          <Field label="Ghi chú (tuỳ chọn)" htmlFor="wage-note">
            <Input id="wage-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tăng lương, thử việc…" />
          </Field>

          {/* Lịch sử */}
          {loading ? (
            <Spinner size="sm" textClassName="text-primary-500" />
          ) : wages.length === 0 ? (
            <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">Chưa có mức lương nào.</Typography>
          ) : (
            <Box layoutClassName="flex flex-col gap-1.5">
              <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Lịch sử mức lương</Typography>
              {wages.map((w) => (
                <Box
                  key={w.id}
                  layoutClassName="flex items-center justify-between gap-2 px-3 py-1.5"
                  roundedClassName="rounded-lg"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  borderClassName="border border-slate-200 dark:border-slate-700"
                >
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-slate-800 dark:text-slate-100">{vnd(w.hourlyRate)}/giờ</Typography>
                    <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">từ {fmtDay(w.effectiveDate)}</Typography>
                    {w.note && <Typography as="span" size="xs" textClassName="text-slate-400">— {w.note}</Typography>}
                  </Box>
                  <IconButton label="Xoá mức" size="sm" variant="ghost" onClick={() => remove(w.id, w.hourlyRate)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default WageSection;
