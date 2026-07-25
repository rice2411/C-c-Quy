import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import DatePicker from '@/components/ui/DatePicker';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type ManualExpense } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { fetchManualExpenses, upsertManualExpense, deleteManualExpense } from '@/services/manualExpenseService';

type ManualForm = { id?: string; date: string; amount: string; category: string; spreadMonths: string; note: string };
const EMPTY_MANUAL: ManualForm = { date: '', amount: '', category: 'rent', spreadMonths: '1', note: '' };

/** Chi phí vận hành (OPEX) — nhập tay (mặt bằng/điện nước/wifi...) HOẶC từ phiếu (source=receipt). */
const OpexTab: React.FC = () => {
  const [list, setList] = useState<ManualExpense[]>([]);
  const [form, setForm] = useState<ManualForm>(EMPTY_MANUAL);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const openAdd = () => { setForm(EMPTY_MANUAL); setFormOpen(true); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await fetchManualExpenses());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải chi phí thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    const amount = Number(form.amount);
    const spreadMonths = Math.max(1, Math.floor(Number(form.spreadMonths) || 1));
    if (!form.date || !amount) {
      toast.error('Nhập ngày và số tiền');
      return;
    }
    setBusy(true);
    try {
      await upsertManualExpense({
        id: form.id,
        date: form.date,
        amount,
        category: form.category || 'other',
        spreadMonths,
        note: form.note.trim() || null,
      });
      toast.success(form.id ? 'Đã cập nhật khoản chi' : 'Đã thêm khoản chi');
      setForm(EMPTY_MANUAL);
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu chi phí thất bại');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteManualExpense(id);
      toast.success('Đã xoá khoản chi');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    } finally {
      setBusy(false);
    }
  };

  const edit = (m: ManualExpense) => {
    setForm({
      id: m.id, date: m.date, amount: String(m.amount), category: String(m.category ?? 'other'),
      spreadMonths: String(m.spreadMonths ?? 1), note: m.note ?? '',
    });
    setFormOpen(true);
  };

  if (loading) {
    return (
      <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Typography size="sm" variant="muted">{list.length} khoản</Typography>
        <Button type="button" onClick={openAdd} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>Thêm khoản chi</Button>
      </Box>

      {list.length === 0 ? (
        <EmptyState icon={<Coins className="h-6 w-6" />} title="Chưa có chi phí vận hành" />
      ) : (
        <>
          {/* Mobile: card */}
          <Box layoutClassName="space-y-2 sm:hidden">
            {list.map((m) => (
              <Card key={m.id} padding="sm" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-wrap items-center gap-3">
                <Box layoutClassName="min-w-0 flex-1">
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography size="sm" layoutClassName="truncate font-semibold">
                      {expenseCategoryLabel(m.category)} · {formatVND(m.amount)}
                    </Typography>
                    {m.source === 'receipt' ? (
                      <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-sky-100 dark:bg-sky-900/40">
                        <Typography as="span" size="xs" textClassName="font-medium text-sky-700 dark:text-sky-300">Từ phiếu</Typography>
                      </Box>
                    ) : null}
                    {m.transactionId ? (
                      <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-violet-100 dark:bg-violet-900/40">
                        <Typography as="span" size="xs" textClassName="font-medium text-violet-700 dark:text-violet-300">Từ GD bank</Typography>
                      </Box>
                    ) : null}
                  </Box>
                  <Typography size="xs" variant="muted" layoutClassName="truncate">
                    {m.date.split('-').reverse().join('/')}
                    {m.spreadMonths > 1 ? ` · phân bổ ${formatVND(Math.round(m.amount / m.spreadMonths))}/tháng × ${m.spreadMonths}` : ''}
                    {m.note ? ` · ${m.note}` : ''}
                  </Typography>
                </Box>
                <Button type="button" onClick={() => edit(m)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" disabled={busy} onClick={() => void remove(m.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </Box>
          {/* Desktop: table */}
          <Box layoutClassName="hidden sm:block overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell layoutClassName="p-2 text-left">Loại</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right">Số tiền</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left">Ngày</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left">Phân bổ</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left">Ghi chú</TableHeaderCell>
                  <TableHeaderCell layoutClassName="w-20 p-2"> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id} borderClassName="border-b border-slate-100 dark:border-slate-700/60">
                    <TableCell layoutClassName="p-2">
                      <Box layoutClassName="flex items-center gap-2">
                        <Typography as="span" size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">{expenseCategoryLabel(m.category)}</Typography>
                        {m.source === 'receipt' ? (
                          <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-sky-100 dark:bg-sky-900/40">
                            <Typography as="span" size="xs" textClassName="font-medium text-sky-700 dark:text-sky-300">Từ phiếu</Typography>
                          </Box>
                        ) : null}
                        {m.transactionId ? (
                          <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-violet-100 dark:bg-violet-900/40">
                            <Typography as="span" size="xs" textClassName="font-medium text-violet-700 dark:text-violet-300">Từ GD bank</Typography>
                          </Box>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell layoutClassName="p-2 text-right" textClassName="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatVND(m.amount)}</TableCell>
                    <TableCell layoutClassName="p-2" textClassName="text-sm text-slate-500 dark:text-slate-400">{m.date.split('-').reverse().join('/')}</TableCell>
                    <TableCell layoutClassName="p-2" textClassName="text-sm text-slate-600 dark:text-slate-300">{m.spreadMonths > 1 ? `${formatVND(Math.round(m.amount / m.spreadMonths))}/th × ${m.spreadMonths}` : '—'}</TableCell>
                    <TableCell layoutClassName="p-2" textClassName="text-sm text-slate-600 dark:text-slate-300">{m.note || '—'}</TableCell>
                    <TableCell layoutClassName="p-2">
                      <Box layoutClassName="flex items-center gap-1">
                        <Button type="button" onClick={() => edit(m)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" disabled={busy} onClick={() => void remove(m.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      <BaseSlidePanel
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Sửa khoản chi' : 'Thêm chi phí vận hành'}
        maxWidth="md"
        footer={
          <Box layoutClassName="flex gap-2 p-4">
            <Button type="button" disabled={busy} onClick={() => void save()} variant="primary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
              {form.id ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button type="button" onClick={() => setFormOpen(false)} variant="secondary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
          </Box>
        }
      >
        <Box layoutClassName="space-y-3 p-4">
          <Typography size="xs" variant="muted">
            Dùng cho khoản KHÔNG qua ngân hàng. "Phân bổ" &gt; 1 tháng → chia đều mỗi tháng (vd trả trước tiền thuê 6 tháng).
          </Typography>
          <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} fullWidth placeholder="Ngày chi (hoặc bắt đầu phân bổ)" />
          <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {EXPENSE_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </Select>
          <Input type="number" min={0} value={form.amount} placeholder="Số tiền (VND)" onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} fullWidth />
          <Input type="number" min={1} value={form.spreadMonths} placeholder="Phân bổ (số tháng, 1 = ghi 1 lần)" onChange={(e) => setForm((f) => ({ ...f, spreadMonths: e.target.value }))} fullWidth />
          <Input value={form.note} placeholder="Ghi chú (tuỳ chọn)" onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} fullWidth />
        </Box>
      </BaseSlidePanel>
    </Box>
  );
};

export default OpexTab;
