import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, Building2, Coins, Pencil, Trash2, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import StatsBanner from '@/components/ui/StatsBanner';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import DatePicker from '@/components/ui/DatePicker';
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  ASSET_CATEGORIES,
  type Asset,
  type ManualExpense,
} from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { fetchAssets, upsertAsset, deleteAsset } from '@/services/assetService';
import {
  fetchManualExpenses,
  upsertManualExpense,
  deleteManualExpense,
} from '@/services/manualExpenseService';

type TopTab = 'overview' | 'manual' | 'assets';

type AssetForm = { id?: string; name: string; cost: string; usefulMonths: string; startDate: string; category: string };
const EMPTY_ASSET: AssetForm = { name: '', cost: '', usefulMonths: '12', startDate: '', category: 'equipment' };

type ManualForm = { id?: string; date: string; amount: string; category: string; spreadMonths: string; note: string };
const EMPTY_MANUAL: ManualForm = { date: '', amount: '', category: 'rent', spreadMonths: '1', note: '' };

const CAT_COLORS = ['#8b5cf6', '#0ea5e9', '#16a34a', '#d97706', '#e11d48', '#4abab9', '#64748b', '#f59e0b'];

const ExpensesPage: React.FC = () => {
  const initial = computePresetRange('month');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [preset, setPreset] = useState<DatePreset>('month');
  const [tab, setTab] = useState<TopTab>('overview');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET);
  const [manualList, setManualList] = useState<ManualExpense[]>([]);
  const [manualForm, setManualForm] = useState<ManualForm>(EMPTY_MANUAL);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      setFromDate(r.from);
      setToDate(r.to);
    }
    setPreset(p);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        fetchAssets(),
        fetchManualExpenses(),
      ]);
      setAssets(a);
      setManualList(m);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải dữ liệu chi phí thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Tổng quan: tính từ chi phí thủ công phát sinh trong kỳ ──
  const manualInPeriod = useMemo(() => {
    const f = fromDate.slice(0, 10);
    const t = toDate.slice(0, 10);
    return manualList.filter((m) => m.date >= f && m.date <= t);
  }, [manualList, fromDate, toDate]);

  const totalOpex = useMemo(
    () => manualInPeriod.reduce((s, m) => s + (m.amount || 0), 0),
    [manualInPeriod],
  );

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    manualInPeriod.forEach((m) => {
      const key = m.category || 'other';
      map.set(key, (map.get(key) || 0) + (m.amount || 0));
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [manualInPeriod]);

  // ── Tài sản (khấu hao) ──
  const saveAsset = async () => {
    const cost = Number(assetForm.cost);
    const usefulMonths = Math.max(1, Math.floor(Number(assetForm.usefulMonths) || 1));
    if (!assetForm.name.trim() || !cost || !assetForm.startDate) {
      toast.error('Nhập tên, nguyên giá và ngày bắt đầu');
      return;
    }
    setBusy(true);
    try {
      await upsertAsset({
        id: assetForm.id,
        name: assetForm.name.trim(),
        cost,
        usefulMonths,
        startDate: assetForm.startDate,
        category: assetForm.category || null,
      });
      toast.success(assetForm.id ? 'Đã cập nhật tài sản' : 'Đã thêm tài sản');
      setAssetForm(EMPTY_ASSET);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu tài sản thất bại');
    } finally {
      setBusy(false);
    }
  };

  const removeAsset = async (id: string) => {
    setBusy(true);
    try {
      await deleteAsset(id);
      toast.success('Đã xoá tài sản');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    } finally {
      setBusy(false);
    }
  };

  const editAsset = (a: Asset) => setAssetForm({
    id: a.id, name: a.name, cost: String(a.cost), usefulMonths: String(a.usefulMonths),
    startDate: a.startDate, category: String(a.category ?? 'equipment'),
  });

  // ── Chi phí thủ công (không qua bank) ──
  const saveManual = async () => {
    const amount = Number(manualForm.amount);
    const spreadMonths = Math.max(1, Math.floor(Number(manualForm.spreadMonths) || 1));
    if (!manualForm.date || !amount) {
      toast.error('Nhập ngày và số tiền');
      return;
    }
    setBusy(true);
    try {
      await upsertManualExpense({
        id: manualForm.id,
        date: manualForm.date,
        amount,
        category: manualForm.category || 'other',
        spreadMonths,
        note: manualForm.note.trim() || null,
      });
      toast.success(manualForm.id ? 'Đã cập nhật khoản chi' : 'Đã thêm khoản chi');
      setManualForm(EMPTY_MANUAL);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu chi phí thất bại');
    } finally {
      setBusy(false);
    }
  };

  const removeManual = async (id: string) => {
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

  const editManual = (m: ManualExpense) => setManualForm({
    id: m.id, date: m.date, amount: String(m.amount), category: String(m.category ?? 'other'),
    spreadMonths: String(m.spreadMonths ?? 1), note: m.note ?? '',
  });

  const tabItems = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'manual', label: 'Thủ công' },
    { id: 'assets', label: 'Tài sản' },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4">
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary-500" />
          Chi phí vận hành
        </Heading>
        <Box layoutClassName="ml-auto">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            preset={preset}
            onApplyPreset={applyPreset}
            onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
            onToChange={(v) => { setToDate(v); setPreset('custom'); }}
          />
        </Box>
      </Box>

      <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as TopTab)} />

      {loading ? (
        <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : (
        <Box layoutClassName="flex-1 overflow-y-auto">
          {tab === 'overview' && (
            <Box layoutClassName="space-y-4">
              <StatsBanner
                items={[
                  { icon: Wallet, label: 'Tổng chi phí kỳ', value: formatVND(totalOpex), accent: '#8b5cf6' },
                  { icon: Building2, label: 'Số khoản', value: String(manualInPeriod.length), accent: '#0ea5e9' },
                ]}
              />
              <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                <Typography size="sm" layoutClassName="font-semibold">Cơ cấu chi phí theo loại</Typography>
                {pieData.length === 0 ? (
                  <EmptyState icon={<Wallet className="h-6 w-6" />} title="Chưa có chi phí trong kỳ" />
                ) : (
                  <Box layoutClassName="flex flex-col items-center gap-4 sm:flex-row">
                    <Box layoutClassName="h-52 w-full sm:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatVND(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box layoutClassName="w-full space-y-1.5 sm:w-1/2">
                      {pieData.map((x, i) => (
                        <Box key={x.category} layoutClassName="flex items-center gap-2">
                          <Box layoutClassName="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <Typography size="sm" layoutClassName="min-w-0 flex-1 truncate" textClassName="text-slate-600 dark:text-slate-300">
                            {expenseCategoryLabel(x.category)}
                          </Typography>
                          <Typography size="sm" layoutClassName="font-semibold tabular-nums">{formatVND(x.amount)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Card>
            </Box>
          )}

          {tab === 'manual' && (
            <Box layoutClassName="space-y-4">
              <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                <Typography size="sm" layoutClassName="font-semibold">
                  {manualForm.id ? 'Sửa khoản chi' : 'Thêm chi phí thủ công (tiền mặt / đã trả trước)'}
                </Typography>
                <Typography size="xs" variant="muted">
                  Dùng cho khoản KHÔNG qua ngân hàng. "Phân bổ" &gt; 1 tháng → chia đều mỗi tháng (vd trả trước tiền thuê 6 tháng).
                </Typography>
                <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DatePicker value={manualForm.date} onChange={(v) => setManualForm((f) => ({ ...f, date: v }))} fullWidth placeholder="Ngày chi (hoặc bắt đầu phân bổ)" />
                  <Select value={manualForm.category} onChange={(e) => setManualForm((f) => ({ ...f, category: e.target.value }))}>
                    {EXPENSE_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </Select>
                  <Input type="number" min={0} value={manualForm.amount} placeholder="Số tiền (VND)" onChange={(e) => setManualForm((f) => ({ ...f, amount: e.target.value }))} fullWidth />
                  <Input type="number" min={1} value={manualForm.spreadMonths} placeholder="Phân bổ (số tháng, 1 = ghi 1 lần)" onChange={(e) => setManualForm((f) => ({ ...f, spreadMonths: e.target.value }))} fullWidth />
                  <Input value={manualForm.note} placeholder="Ghi chú (tuỳ chọn)" onChange={(e) => setManualForm((f) => ({ ...f, note: e.target.value }))} fullWidth containerClassName="sm:col-span-2" />
                </Box>
                <Box layoutClassName="flex flex-wrap gap-2">
                  <Button type="button" disabled={busy} onClick={() => void saveManual()} variant="primary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
                    {manualForm.id ? 'Cập nhật' : 'Thêm'}
                  </Button>
                  {manualForm.id ? (
                    <Button type="button" onClick={() => setManualForm(EMPTY_MANUAL)} variant="secondary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
                  ) : null}
                </Box>
              </Card>

              {manualList.length === 0 ? (
                <EmptyState icon={<Coins className="h-6 w-6" />} title="Chưa có chi phí thủ công" />
              ) : (
                <Box layoutClassName="space-y-2">
                  {manualList.map((m) => (
                    <Card key={m.id} padding="sm" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-wrap items-center gap-3">
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography size="sm" layoutClassName="truncate font-semibold">
                          {expenseCategoryLabel(m.category)} · {formatVND(m.amount)}
                        </Typography>
                        <Typography size="xs" variant="muted" layoutClassName="truncate">
                          {m.date.split('-').reverse().join('/')}
                          {m.spreadMonths > 1 ? ` · phân bổ ${formatVND(Math.round(m.amount / m.spreadMonths))}/tháng × ${m.spreadMonths}` : ''}
                          {m.note ? ` · ${m.note}` : ''}
                        </Typography>
                      </Box>
                      <Button type="button" onClick={() => editManual(m)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" disabled={busy} onClick={() => void removeManual(m.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tab === 'assets' && (
            <Box layoutClassName="space-y-4">
              <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                <Typography size="sm" layoutClassName="font-semibold">
                  {assetForm.id ? 'Sửa tài sản' : 'Thêm tài sản (CSVC/thiết bị)'}
                </Typography>
                <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input value={assetForm.name} placeholder="Tên (vd Tủ lạnh)" onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
                  <Select value={assetForm.category} onChange={(e) => setAssetForm((f) => ({ ...f, category: e.target.value }))}>
                    {ASSET_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </Select>
                  <Input type="number" min={0} value={assetForm.cost} placeholder="Nguyên giá (VND)" onChange={(e) => setAssetForm((f) => ({ ...f, cost: e.target.value }))} fullWidth />
                  <Input type="number" min={1} value={assetForm.usefulMonths} placeholder="Số tháng khấu hao" onChange={(e) => setAssetForm((f) => ({ ...f, usefulMonths: e.target.value }))} fullWidth />
                  <DatePicker value={assetForm.startDate} onChange={(v) => setAssetForm((f) => ({ ...f, startDate: v }))} fullWidth placeholder="Ngày bắt đầu khấu hao" />
                </Box>
                <Box layoutClassName="flex flex-wrap gap-2">
                  <Button type="button" disabled={busy} onClick={() => void saveAsset()} variant="primary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
                    {assetForm.id ? 'Cập nhật' : 'Thêm'}
                  </Button>
                  {assetForm.id ? (
                    <Button type="button" onClick={() => setAssetForm(EMPTY_ASSET)} variant="secondary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
                  ) : null}
                </Box>
              </Card>

              {assets.length === 0 ? (
                <EmptyState icon={<Boxes className="h-6 w-6" />} title="Chưa có tài sản" />
              ) : (
                <Box layoutClassName="space-y-2">
                  {assets.map((a) => (
                    <Card key={a.id} padding="sm" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-wrap items-center gap-3">
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography size="sm" layoutClassName="truncate font-semibold">{a.name}</Typography>
                        <Typography size="xs" variant="muted" layoutClassName="truncate">
                          {formatVND(a.cost)} / {a.usefulMonths} tháng · {formatVND(Math.round(a.cost / Math.max(1, a.usefulMonths)))}/tháng · từ {a.startDate.split('-').reverse().join('/')}
                        </Typography>
                      </Box>
                      <Button type="button" onClick={() => editAsset(a)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" disabled={busy} onClick={() => void removeAsset(a.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ExpensesPage;
