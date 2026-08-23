import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChefHat, Pencil, Plus, Trash2, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import {
  MARGIN_OPTIONS, RECIPE_CATEGORIES, LABOR_TIERS,
  recipeCategoryLabel, marginLabel,
  type Recipe, type Ingredient, type RecipeCategory,
} from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import {
  fetchRecipes, fetchIngredients, upsertRecipe, setRecipeMargin, deleteRecipe,
  type RecipeUpsertPayload,
} from '@/services/recipeService';

type FormLine = { key: string; source: string; qty: string; unit: string };
type RecipeForm = {
  id?: number;
  name: string;
  kind: 'product' | 'semi';
  category: string;
  yieldQty: string;
  yieldUnit: string;
  laborTier: string;
  laborCost: string;
  overheadCost: string;
  packagingCost: string;
  wastePct: string;
  marginPct: string;
  lines: FormLine[];
};

const LABOR_PRESET: Record<string, number> = { easy: 800, medium: 1500, hard: 2500 };
const EMPTY_FORM: RecipeForm = {
  name: '', kind: 'product', category: 'drink', yieldQty: '1', yieldUnit: 'ly',
  laborTier: 'easy', laborCost: '800', overheadCost: '500', packagingCost: '1800',
  wastePct: '5', marginPct: '0.4', lines: [],
};

let lineSeq = 0;
const newLineKey = () => `l${lineSeq++}`;
const srcKey = (l: { ingredientId?: number | null; childRecipeId?: number | null }) =>
  l.ingredientId ? `i:${l.ingredientId}` : l.childRecipeId ? `r:${l.childRecipeId}` : '';

/** Công thức & Giá thành: NVL(giá max) + bao bì + công + vận hành + hao hụt → giá bán theo mức lãi/SP. */
const RecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'price' | 'detail'>('price');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rs, ing] = await Promise.all([fetchRecipes(), fetchIngredients()]);
      setRecipes(rs);
      setIngredients(ing);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải công thức thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const semis = useMemo(() => recipes.filter((r) => r.kind === 'semi'), [recipes]);
  const products = useMemo(() => recipes.filter((r) => r.kind === 'product'), [recipes]);
  const byCat = useMemo(() => {
    const map: Record<string, Recipe[]> = {};
    products.forEach((r) => { const k = r.category ?? 'other'; (map[k] ||= []).push(r); });
    return map;
  }, [products]);

  const summary = useMemo(() => {
    if (products.length === 0) return null;
    const profit = products.reduce((s, r) => s + r.profit, 0) / products.length;
    const margin = products.reduce((s, r) => s + r.marginPct, 0) / products.length;
    return { count: products.length, profit: Math.round(profit), margin };
  }, [products]);

  // Nguồn cho dòng công thức: NVL + bán thành phẩm
  const lineSources = useMemo(() => {
    const ing = ingredients.map((i) => ({ key: `i:${i.id}`, label: `🧂 ${i.name} (${i.unit})`, unit: i.unit }));
    const rec = semis.map((s) => ({ key: `r:${s.id}`, label: `🥣 ${s.name} (${s.yieldUnit})`, unit: s.yieldUnit }));
    return [...ing, ...rec];
  }, [ingredients, semis]);
  const sourceUnit = useCallback((key: string) => lineSources.find((s) => s.key === key)?.unit ?? 'g', [lineSources]);

  const openAdd = () => { setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (r: Recipe) => {
    setForm({
      id: r.id, name: r.name, kind: r.kind, category: r.category ?? 'drink',
      yieldQty: String(r.yieldQty), yieldUnit: r.yieldUnit,
      laborTier: r.laborTier ?? 'easy', laborCost: String(r.labor),
      overheadCost: String(r.overhead), packagingCost: String(r.packaging),
      wastePct: String(Math.round(r.wastePct * 100)), marginPct: String(r.marginPct),
      lines: r.lines.map((l) => ({ key: newLineKey(), source: srcKey(l), qty: String(l.qty), unit: l.unit })),
    });
    setFormOpen(true);
  };

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { key: newLineKey(), source: '', qty: '', unit: 'g' }] }));
  const removeLine = (key: string) => setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.key !== key) }));
  const setLine = (key: string, patch: Partial<FormLine>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  const changeMargin = async (r: Recipe, marginPct: number) => {
    setBusy(true);
    try {
      const updated = await setRecipeMargin(r.id, marginPct);
      setRecipes((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Đổi mức lãi thất bại');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên món'); return; }
    const lines = form.lines
      .filter((l) => l.source && Number(l.qty) > 0)
      .map((l, i) => {
        const [t, idStr] = l.source.split(':');
        const id = Number(idStr);
        return {
          ingredientId: t === 'i' ? id : null,
          childRecipeId: t === 'r' ? id : null,
          qty: Number(l.qty),
          unit: l.unit || 'g',
          sortOrder: i + 1,
        };
      });
    const payload: RecipeUpsertPayload = {
      id: form.id,
      name: form.name.trim(),
      kind: form.kind,
      category: form.kind === 'semi' ? null : form.category,
      yieldQty: Math.max(0.0001, Number(form.yieldQty) || 1),
      yieldUnit: form.yieldUnit || 'cai',
      laborTier: form.laborTier || null,
      laborCost: Number(form.laborCost) || 0,
      overheadCost: Number(form.overheadCost) || 0,
      packagingCost: Number(form.packagingCost) || 0,
      wastePct: (Number(form.wastePct) || 0) / 100,
      marginPct: Number(form.marginPct) || 0,
      lines,
    };
    setBusy(true);
    try {
      await upsertRecipe(payload);
      toast.success(form.id ? 'Đã cập nhật công thức' : 'Đã thêm công thức');
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu công thức thất bại');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Recipe) => {
    setBusy(true);
    try {
      await deleteRecipe(r.id);
      toast.success('Đã xoá công thức');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    } finally {
      setBusy(false);
    }
  };

  const marginOptionsFor = (m: number) => {
    const has = MARGIN_OPTIONS.some((o) => Math.abs(o.value - m) < 1e-6);
    return has ? MARGIN_OPTIONS : [{ value: m, label: marginLabel(m) }, ...MARGIN_OPTIONS];
  };

  const renderDetailCard = (r: Recipe) => (
    <Box key={r.id} layoutClassName="flex flex-col gap-2 p-3" backgroundClassName="bg-white dark:bg-slate-800/40" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Typography as="span" size="sm" layoutClassName="font-semibold text-slate-800 dark:text-slate-100">{r.name}</Typography>
        {r.kind === 'product' ? (
          <Typography as="span" size="sm" layoutClassName="font-semibold text-primary-600 dark:text-primary-400">{formatVND(r.suggestedPrice)}</Typography>
        ) : (
          <Typography as="span" size="xs" variant="muted">BTP</Typography>
        )}
      </Box>
      <Typography size="xs" variant="muted">Mẻ {r.yieldQty} {r.yieldUnit} · giá thành {formatVND(r.totalCost)}{r.kind === 'product' ? ` · lãi ${formatVND(r.profit)} (${marginLabel(r.marginPct)})` : ''}</Typography>
      <Box layoutClassName="flex flex-col gap-0.5 pt-1.5" borderClassName="border-t border-slate-100 dark:border-slate-700/60">
        {r.lines.map((l, i) => (
          <Box key={l.id ?? i} layoutClassName="flex items-center justify-between gap-2">
            <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">{l.kind === 'recipe' ? '🥣 ' : '• '}{l.name} · {l.qty}{l.unit}</Typography>
            <Typography as="span" size="xs" variant="muted" layoutClassName="tabular-nums">{formatVND(l.lineCost ?? 0)}</Typography>
          </Box>
        ))}
      </Box>
      {r.kind === 'product' ? (
        <Box layoutClassName="pt-1" borderClassName="border-t border-slate-100 dark:border-slate-700/60">
          <Typography size="xs" variant="muted">NVL {formatVND(r.nvl)} · công {formatVND(r.labor)} · vh {formatVND(r.overhead)} · bao bì {formatVND(r.packaging)} · hao hụt {formatVND(r.waste)}</Typography>
        </Box>
      ) : null}
    </Box>
  );

  if (loading) {
    return (
      <Box layoutClassName="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="flex h-full flex-col gap-4">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Công thức & Giá thành</Heading>
        </Box>
        <Button type="button" onClick={openAdd} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>Thêm công thức</Button>
      </Box>

      {summary ? (
        <Box layoutClassName="flex flex-wrap gap-4" backgroundClassName="bg-slate-50 dark:bg-slate-800/40" roundedClassName="rounded-xl" borderClassName="border border-slate-200 dark:border-slate-700">
          <Box layoutClassName="px-4 py-2">
            <Typography size="xs" variant="muted">Số món</Typography>
            <Typography size="sm" layoutClassName="font-semibold">{summary.count}</Typography>
          </Box>
          <Box layoutClassName="px-4 py-2">
            <Typography size="xs" variant="muted">Lãi TB / món</Typography>
            <Typography size="sm" layoutClassName="font-semibold text-emerald-600 dark:text-emerald-400">{formatVND(summary.profit)}</Typography>
          </Box>
          <Box layoutClassName="px-4 py-2">
            <Typography size="xs" variant="muted">Mức lãi TB</Typography>
            <Typography size="sm" layoutClassName="font-semibold">{marginLabel(summary.margin)}</Typography>
          </Box>
        </Box>
      ) : null}

      {recipes.length > 0 ? (
        <Box layoutClassName="flex items-center gap-2">
          <Button type="button" onClick={() => setView('price')} variant={view === 'price' ? 'primary' : 'secondary'} sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" disableVariantHover>Bảng giá</Button>
          <Button type="button" onClick={() => setView('detail')} variant={view === 'detail' ? 'primary' : 'secondary'} sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" disableVariantHover>Công thức chi tiết</Button>
        </Box>
      ) : null}

      {recipes.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-6 w-6" />} title="Chưa có công thức" />
      ) : view === 'detail' ? (
        <Box layoutClassName="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...products, ...semis].map((r) => renderDetailCard(r))}
        </Box>
      ) : (
        <Box layoutClassName="flex flex-col gap-6">
          {(['cake', 'cookie', 'drink'] as RecipeCategory[]).map((cat) => {
            const list = byCat[cat] ?? [];
            if (list.length === 0) return null;
            return (
              <Box key={cat} layoutClassName="flex flex-col gap-2">
                <Typography size="sm" layoutClassName="font-semibold text-slate-700 dark:text-slate-200">{recipeCategoryLabel(cat)} · {list.length}</Typography>
                <Box layoutClassName="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell layoutClassName="p-2 text-left">Món</TableHeaderCell>
                        <TableHeaderCell layoutClassName="p-2 text-right">Giá thành</TableHeaderCell>
                        <TableHeaderCell layoutClassName="p-2 text-center">Mức lãi</TableHeaderCell>
                        <TableHeaderCell layoutClassName="p-2 text-right">Giá bán</TableHeaderCell>
                        <TableHeaderCell layoutClassName="p-2 text-right">Lãi/cái</TableHeaderCell>
                        <TableHeaderCell layoutClassName="w-20 p-2"> </TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {list.map((r) => (
                        <TableRow key={r.id} borderClassName="border-b border-slate-100 dark:border-slate-700/60">
                          <TableCell layoutClassName="p-2">
                            <Typography as="span" size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">{r.name}</Typography>
                            <Typography size="xs" variant="muted">NVL {formatVND(r.nvl)} · công {formatVND(r.labor)} · vh {formatVND(r.overhead)} · bao bì {formatVND(r.packaging)} · hao hụt {formatVND(r.waste)}</Typography>
                          </TableCell>
                          <TableCell layoutClassName="p-2 text-right" textClassName="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatVND(r.totalCost)}</TableCell>
                          <TableCell layoutClassName="p-2 text-center">
                            <Select value={String(r.marginPct)} onChange={(e) => void changeMargin(r, Number(e.target.value))} sizeClassName="px-2 py-1 text-xs">
                              {marginOptionsFor(r.marginPct).map((o) => (<option key={o.value} value={String(o.value)}>{o.label}</option>))}
                            </Select>
                          </TableCell>
                          <TableCell layoutClassName="p-2 text-right" textClassName="text-sm font-semibold tabular-nums text-primary-600 dark:text-primary-400">{formatVND(r.suggestedPrice)}</TableCell>
                          <TableCell layoutClassName="p-2 text-right" textClassName="text-sm tabular-nums text-emerald-600 dark:text-emerald-400">{formatVND(r.profit)}</TableCell>
                          <TableCell layoutClassName="p-2">
                            <Box layoutClassName="flex items-center gap-1">
                              <Button type="button" onClick={() => openEdit(r)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500"><Pencil className="h-4 w-4" /></Button>
                              <Button type="button" disabled={busy} onClick={() => void remove(r)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10"><Trash2 className="h-4 w-4" /></Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            );
          })}

          {/* Bán thành phẩm */}
          {semis.length > 0 ? (
            <Box layoutClassName="flex flex-col gap-2">
              <Typography size="sm" layoutClassName="font-semibold text-slate-700 dark:text-slate-200">Bán thành phẩm · {semis.length}</Typography>
              <Box layoutClassName="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell layoutClassName="p-2 text-left">Tên</TableHeaderCell>
                      <TableHeaderCell layoutClassName="p-2 text-right">Mẻ ra</TableHeaderCell>
                      <TableHeaderCell layoutClassName="p-2 text-right">Giá NVL / đơn vị</TableHeaderCell>
                      <TableHeaderCell layoutClassName="w-20 p-2"> </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {semis.map((r) => (
                      <TableRow key={r.id} borderClassName="border-b border-slate-100 dark:border-slate-700/60">
                        <TableCell layoutClassName="p-2"><Typography as="span" size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">{r.name}</Typography></TableCell>
                        <TableCell layoutClassName="p-2 text-right" textClassName="text-sm tabular-nums text-slate-600 dark:text-slate-300">{r.yieldQty} {r.yieldUnit}</TableCell>
                        <TableCell layoutClassName="p-2 text-right" textClassName="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatVND(r.nvl)}/{r.yieldUnit}</TableCell>
                        <TableCell layoutClassName="p-2">
                          <Box layoutClassName="flex items-center gap-1">
                            <Button type="button" onClick={() => openEdit(r)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500"><Pencil className="h-4 w-4" /></Button>
                            <Button type="button" disabled={busy} onClick={() => void remove(r)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10"><Trash2 className="h-4 w-4" /></Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}
        </Box>
      )}

      {/* Editor */}
      <BaseSlidePanel
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Sửa công thức' : 'Thêm công thức'}
        maxWidth="lg"
        footer={
          <Box layoutClassName="flex gap-2 p-4">
            <Button type="button" disabled={busy} onClick={() => void save()} variant="primary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" disableVariantHover>{form.id ? 'Cập nhật' : 'Thêm'}</Button>
            <Button type="button" onClick={() => setFormOpen(false)} variant="secondary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
          </Box>
        }
      >
        <Box layoutClassName="flex flex-col gap-4 p-4">
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input value={form.name} placeholder="Tên món" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <Select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as RecipeForm['kind'] }))}>
              <option value="product">Sản phẩm bán</option>
              <option value="semi">Bán thành phẩm</option>
            </Select>
            {form.kind === 'product' ? (
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {RECIPE_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </Select>
            ) : null}
            <Box layoutClassName="grid grid-cols-2 gap-2">
              <Input type="number" min={0} value={form.yieldQty} placeholder="Mẻ ra (SL)" onChange={(e) => setForm((f) => ({ ...f, yieldQty: e.target.value }))} fullWidth />
              <Input value={form.yieldUnit} placeholder="Đơn vị (cai/ly/ml…)" onChange={(e) => setForm((f) => ({ ...f, yieldUnit: e.target.value }))} fullWidth />
            </Box>
          </Box>

          {form.kind === 'product' ? (
            <Box layoutClassName="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Mức công</Typography>
                <Select value={form.laborTier} onChange={(e) => setForm((f) => ({ ...f, laborTier: e.target.value, laborCost: String(LABOR_PRESET[e.target.value] ?? f.laborCost) }))}>
                  {LABOR_TIERS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </Select>
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Công / đơn vị</Typography>
                <Input type="number" min={0} value={form.laborCost} onChange={(e) => setForm((f) => ({ ...f, laborCost: e.target.value }))} fullWidth />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Vận hành / đơn vị</Typography>
                <Input type="number" min={0} value={form.overheadCost} onChange={(e) => setForm((f) => ({ ...f, overheadCost: e.target.value }))} fullWidth />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Bao bì / đơn vị</Typography>
                <Input type="number" min={0} value={form.packagingCost} onChange={(e) => setForm((f) => ({ ...f, packagingCost: e.target.value }))} fullWidth />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Hao hụt (%)</Typography>
                <Input type="number" min={0} value={form.wastePct} onChange={(e) => setForm((f) => ({ ...f, wastePct: e.target.value }))} fullWidth />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography size="xs" variant="muted">Mức lợi nhuận</Typography>
                <Select value={form.marginPct} onChange={(e) => setForm((f) => ({ ...f, marginPct: e.target.value }))}>
                  {MARGIN_OPTIONS.map((o) => (<option key={o.value} value={String(o.value)}>{o.label}</option>))}
                </Select>
              </Box>
            </Box>
          ) : null}

          {/* Dòng công thức */}
          <Box layoutClassName="flex flex-col gap-2">
            <Box layoutClassName="flex items-center justify-between">
              <Typography size="sm" layoutClassName="font-semibold text-slate-700 dark:text-slate-200">Nguyên liệu / bán thành phẩm</Typography>
              <Button type="button" onClick={addLine} variant="secondary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3 [&_svg]:w-3" sizeClassName="px-2 py-1 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1" disableVariantHover>Thêm dòng</Button>
            </Box>
            {form.lines.length === 0 ? (
              <Typography size="xs" variant="muted">Chưa có dòng nào — bấm “Thêm dòng”.</Typography>
            ) : (
              <Box layoutClassName="flex flex-col gap-2">
                {form.lines.map((l) => (
                  <Box key={l.key} layoutClassName="grid grid-cols-12 items-center gap-2">
                    <Box layoutClassName="col-span-7">
                      <Select value={l.source} onChange={(e) => setLine(l.key, { source: e.target.value, unit: sourceUnit(e.target.value) })} sizeClassName="px-2 py-1.5 text-xs">
                        <option value="">— chọn —</option>
                        {lineSources.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
                      </Select>
                    </Box>
                    <Box layoutClassName="col-span-2">
                      <Input type="number" min={0} value={l.qty} placeholder="SL" onChange={(e) => setLine(l.key, { qty: e.target.value })} fullWidth />
                    </Box>
                    <Box layoutClassName="col-span-2">
                      <Input value={l.unit} placeholder="đv" onChange={(e) => setLine(l.key, { unit: e.target.value })} fullWidth />
                    </Box>
                    <Box layoutClassName="col-span-1 flex justify-end">
                      <Button type="button" onClick={() => removeLine(l.key)} aria-label="Xoá dòng" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1" roundedClassName="rounded" textClassName="text-red-500"><X className="h-4 w-4" /></Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Typography size="xs" variant="muted">Lượng dùng tính cho CẢ MẺ (theo “mẻ ra” ở trên). Bán thành phẩm 🥣 sẽ được tính đệ quy xuống NVL gốc.</Typography>
          </Box>
        </Box>
      </BaseSlidePanel>
    </Box>
  );
};

export default RecipesPage;
