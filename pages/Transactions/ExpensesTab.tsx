import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Coins, Receipt, Plus, Trash2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { SavedStockReceiptSummary } from '@/types/billReceipt';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory, expenseCategoryLabel } from '@/types/expense';
import { fetchCommissionSummariesApi } from '@/services/api/commissionApi';
import { fetchStockReceiptSummaries } from '@/services/stockReceiptService';
import { fetchExpenses, addExpense, updateExpense, deleteExpense } from '@/services/expenseService';
import {
  revenueOrdersInPeriod, stockReceiptsInPeriod, expensesInPeriod,
} from '@/services/revenueService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import { ButtonSpinner } from '@/pages/Commission/components/commissionUi';

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; total: string; accent: string; children: React.ReactNode }> = ({
  icon, title, total, accent, children,
}) => (
  <Card padding="none" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-hidden">
    <Box layoutClassName="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
      <Box layoutClassName="flex items-center gap-2">
        <Box layoutClassName="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: accent + '22', color: accent }}>
          {icon}
        </Box>
        <Typography as="p" size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{title}</Typography>
      </Box>
      <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{total}</Typography>
    </Box>
    {children}
  </Card>
);

/* ───────────────────────── form chi phí khác ───────────────────────────── */
interface ExpenseFormState {
  description: string;
  amount: string;
  date: string;
  category: ExpenseCategory;
  note: string;
}

const emptyForm = (): ExpenseFormState => ({ description: '', amount: '', date: todayISO(), category: 'other', note: '' });

const ExpensesTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { orders } = useOrders();
  const { userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stockReceipts, setStockReceipts] = useState<SavedStockReceiptSummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commissionOrders, setCommissionOrders] = useState<Order[]>([]);

  const [form, setForm] = useState<ExpenseFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const [summaries, receipts, exp] = await Promise.all([
        fetchCommissionSummariesApi(),
        fetchStockReceiptSummaries(),
        fetchExpenses(),
      ]);
      if (!alive) return;
      setStockReceipts(receipts);
      setExpenses(exp);
      setCommissionOrders(summaries.flatMap(s => s.orders));
    })()
      .catch(() => toast.error('Không tải được dữ liệu chi phí'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const periodReceipts = useMemo(() => stockReceiptsInPeriod(stockReceipts, fromDate, toDate), [stockReceipts, fromDate, toDate]);
  const periodExpenses = useMemo(() => expensesInPeriod(expenses, fromDate, toDate), [expenses, fromDate, toDate]);
  const periodCommissionOrders = useMemo(() => revenueOrdersInPeriod(commissionOrders, fromDate, toDate), [commissionOrders, fromDate, toDate]);

  const totalStockIn = useMemo(() => periodReceipts.reduce((s, r) => s + (r.totalAmount ?? 0), 0), [periodReceipts]);
  const totalCommission = useMemo(() => periodCommissionOrders.reduce((s, o) => s + (o.commissionAmount ?? 0), 0), [periodCommissionOrders]);
  const totalExpenses = useMemo(() => periodExpenses.reduce((s, e) => s + (e.amount ?? 0), 0), [periodExpenses]);

  const startAdd = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const startEdit = (e: Expense) => {
    setForm({ description: e.description, amount: String(e.amount), date: e.date || todayISO(), category: e.category, note: e.note ?? '' });
    setEditingId(e.id);
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm()); };

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!form.description.trim()) { toast.error('Nhập mô tả chi phí'); return; }
    if (!amount || amount <= 0) { toast.error('Số tiền không hợp lệ'); return; }
    setSaving(true);
    try {
      const payload = {
        description: form.description.trim(),
        amount,
        date: form.date || todayISO(),
        category: form.category,
        note: form.note.trim() || undefined,
        createdBy: userData?.uid,
      };
      if (editingId) {
        await updateExpense(editingId, payload);
        setExpenses(prev => prev.map(e => e.id === editingId ? { ...e, ...payload } : e));
        toast.success('Đã cập nhật chi phí');
      } else {
        const created = await addExpense(payload);
        setExpenses(prev => [created, ...prev]);
        toast.success('Đã thêm chi phí');
      }
      cancelForm();
    } catch {
      toast.error('Không thể lưu chi phí');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: Expense) => {
    if (!window.confirm(`Xoá chi phí "${e.description}"?`)) return;
    try {
      await deleteExpense(e.id);
      setExpenses(prev => prev.filter(x => x.id !== e.id));
      toast.success('Đã xoá chi phí');
    } catch {
      toast.error('Không thể xoá');
    }
  };

  if (loading) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-orange-500" /></Box>;
  }

  return (
    <Box layoutClassName="space-y-4">
      {/* Nhập kho */}
      <SectionCard icon={<Boxes className="h-4 w-4" />} title="Nhập kho" total={formatVND(totalStockIn)} accent="#d97706">
        {periodReceipts.length === 0 ? (
          <Typography as="p" size="xs" variant="muted" layoutClassName="px-4 py-4">Không có phiếu nhập trong kỳ.</Typography>
        ) : (
          <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
            {periodReceipts.map(r => (
              <Box key={r.id} layoutClassName="flex items-center justify-between gap-3 px-4 py-2.5">
                <Box layoutClassName="min-w-0">
                  <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{r.supplierNameRaw || 'Nhà cung cấp ?'}</Typography>
                  <Typography as="p" size="xs" variant="muted">{fmtDate(r.receiptDate ?? r.createdAt)}{r.invoiceNumber ? ` · ${r.invoiceNumber}` : ''}</Typography>
                </Box>
                <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(r.totalAmount ?? 0)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      {/* Hoa hồng */}
      <SectionCard icon={<Coins className="h-4 w-4" />} title="Hoa hồng CTV" total={formatVND(totalCommission)} accent="#ea580c">
        <Box layoutClassName="px-4 py-3">
          <Typography as="p" size="xs" variant="muted">
            {periodCommissionOrders.length} đơn có hoa hồng trong kỳ (theo ngày giao). Chi tiết theo CTV xem ở trang <strong>Hoa hồng</strong>.
          </Typography>
        </Box>
      </SectionCard>

      {/* Chi phí khác */}
      <SectionCard icon={<Receipt className="h-4 w-4" />} title="Chi phí khác" total={formatVND(totalExpenses)} accent="#64748b">
        <Box layoutClassName="space-y-3 p-4">
          {!showForm ? (
            <Button
              type="button"
              onClick={startAdd}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              layoutClassName="inline-flex items-center gap-1.5"
              roundedClassName="rounded-lg"
              borderClassName="border border-dashed border-slate-300 hover:border-orange-400 dark:border-slate-600"
              backgroundClassName="bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20"
              sizeClassName="px-3 py-1.5 text-xs"
              textClassName="font-medium text-slate-600 hover:text-orange-600 dark:text-slate-300"
              stateClassName="transition-colors">
              <Plus className="h-3.5 w-3.5" /> Thêm chi phí
            </Button>
          ) : (
            <Box layoutClassName="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/30">
              <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Mô tả" required>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="VD: Tiền điện tháng 6" fullWidth />
                </Field>
                <Field label="Số tiền (VND)" required>
                  <Input type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" fullWidth />
                </Field>
                <Field label="Ngày">
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} fullWidth />
                </Field>
                <Field label="Loại">
                  <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} fullWidth>
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
              </Box>
              <Box layoutClassName="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  layoutClassName="inline-flex items-center gap-1.5"
                  roundedClassName="rounded-lg"
                  borderClassName="border-transparent"
                  backgroundClassName="bg-orange-600 hover:bg-orange-700"
                  sizeClassName="px-3 py-1.5 text-xs"
                  textClassName="font-semibold text-white"
                  stateClassName="transition-colors disabled:opacity-60">
                  {saving ? <ButtonSpinner /> : null}
                  {editingId ? 'Cập nhật' : 'Lưu chi phí'}
                </Button>
                <Button
                  type="button"
                  onClick={cancelForm}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  layoutClassName="inline-flex items-center gap-1"
                  roundedClassName="rounded-lg"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  sizeClassName="px-3 py-1.5 text-xs"
                  textClassName="font-medium text-slate-500 dark:text-slate-400"
                  stateClassName="transition-colors">
                  <X className="h-3.5 w-3.5" /> Huỷ
                </Button>
              </Box>
            </Box>
          )}

          {periodExpenses.length === 0 ? (
            <Typography as="p" size="xs" variant="muted">Chưa có chi phí khác trong kỳ.</Typography>
          ) : (
            <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
              {periodExpenses.map(e => (
                <Box key={e.id} layoutClassName="flex items-center gap-3 py-2.5">
                  <Box layoutClassName="min-w-0 flex-1">
                    <Box layoutClassName="flex items-center gap-2">
                      <Typography as="span" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{e.description}</Typography>
                      <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-[10px] font-medium text-slate-500 dark:text-slate-300">{expenseCategoryLabel(e.category)}</Badge>
                    </Box>
                    <Typography as="p" size="xs" variant="muted">{fmtDate(e.date)}{e.note ? ` · ${e.note}` : ''}</Typography>
                  </Box>
                  <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(e.amount)}</Typography>
                  <Button
                    type="button"
                    onClick={() => startEdit(e)}
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    layoutClassName="inline-flex shrink-0"
                    roundedClassName="rounded-md"
                    borderClassName="border-transparent"
                    backgroundClassName="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
                    sizeClassName="p-1"
                    textClassName="text-slate-400 hover:text-orange-500"
                    stateClassName="transition-colors"
                    title="Sửa">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(e)}
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    layoutClassName="inline-flex shrink-0"
                    roundedClassName="rounded-md"
                    borderClassName="border-transparent"
                    backgroundClassName="bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                    sizeClassName="p-1"
                    textClassName="text-slate-400 hover:text-red-500"
                    stateClassName="transition-colors"
                    title="Xoá">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </SectionCard>
    </Box>
  );
};

export default ExpensesTab;
