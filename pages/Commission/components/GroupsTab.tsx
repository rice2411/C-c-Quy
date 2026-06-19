import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  GripVertical,
  AlertCircle,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import {
  CommissionGroup,
  CommissionTier,
  calcItemCommission,
  findGroupForMargin,
  getGroupTiers,
} from '@/types/commissionGroup';
import {
  createCommissionGroup,
  updateCommissionGroup,
  deleteCommissionGroup,
} from '@/services/commissionGroupService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { pct, ButtonSpinner } from './commissionUi';

/** Dạng tier đang chỉnh sửa (string để nhập liệu mượt) */
interface EditableTier {
  minQty: string;
  rate: string; // % (đã nhân 100)
}

const toEditableTiers = (group: CommissionGroup): EditableTier[] =>
  getGroupTiers(group).map(t => ({
    minQty: String(t.minQty),
    rate: String(+(t.profitShareRate * 100).toFixed(1)),
  }));

const normalizeTiers = (tiers: EditableTier[]): CommissionTier[] =>
  tiers
    .map(t => ({ minQty: Math.max(1, Math.floor(Number(t.minQty) || 1)), profitShareRate: (Number(t.rate) || 0) / 100 }))
    .sort((a, b) => a.minQty - b.minQty);

const FieldLabel: React.FC<{ dotClassName: string; children: React.ReactNode }> = ({ dotClassName, children }) => (
  <Box layoutClassName="flex items-center gap-1.5">
    <Box layoutClassName={`inline-block h-1.5 w-1.5 rounded-full ${dotClassName}`} />
    <Typography as="span" layoutClassName="text-[11px] font-bold uppercase tracking-wide" textClassName="text-slate-500 dark:text-slate-400">
      {children}
    </Typography>
  </Box>
);

interface GroupRowProps {
  group: CommissionGroup;
  products: Product[];
  onUpdate: (id: string, data: Partial<Omit<CommissionGroup, 'id'>>) => Promise<void>;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const GroupRow: React.FC<GroupRowProps> = ({ group, products, onUpdate, onDelete, canDelete }) => {
  const [name, setName] = useState(group.name);
  const [minMargin, setMinMargin] = useState(String(+(group.minMargin * 100).toFixed(1)));
  const [maxMargin, setMaxMargin] = useState(String(+(group.maxMargin * 100).toFixed(1)));
  const [fallback, setFallback] = useState(String(+(group.fallbackRate * 100).toFixed(1)));
  const [tiers, setTiers] = useState<EditableTier[]>(() => toEditableTiers(group));
  const [saving, setSaving] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    setName(group.name);
    setMinMargin(String(+(group.minMargin * 100).toFixed(1)));
    setMaxMargin(String(+(group.maxMargin * 100).toFixed(1)));
    setFallback(String(+(group.fallbackRate * 100).toFixed(1)));
    setTiers(toEditableTiers(group));
  }, [group]);

  const tiersDirty = useMemo(() => {
    const a = JSON.stringify(normalizeTiers(tiers));
    const b = JSON.stringify(getGroupTiers(group).map(t => ({ minQty: t.minQty, profitShareRate: t.profitShareRate })));
    return a !== b;
  }, [tiers, group]);

  const isDirty =
    name !== group.name ||
    Number(minMargin) !== +(group.minMargin * 100).toFixed(1) ||
    Number(maxMargin) !== +(group.maxMargin * 100).toFixed(1) ||
    Number(fallback) !== +(group.fallbackRate * 100).toFixed(1) ||
    tiersDirty;

  const groupProducts = useMemo(() => {
    return products.filter(p => {
      if (p.costPrice === undefined || p.costPrice < 0) return false;
      const profit = p.price - p.costPrice;
      if (profit <= 0) return false;
      const margin = profit / p.price;
      return margin >= group.minMargin && (margin < group.maxMargin || group.maxMargin >= 1);
    });
  }, [products, group]);

  const updateTier = (idx: number, field: keyof EditableTier, value: string) =>
    setTiers(prev => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

  const addTier = () =>
    setTiers(prev => {
      const last = prev[prev.length - 1];
      const nextQty = last ? (Number(last.minQty) || 0) + 10 : 1;
      return [...prev, { minQty: String(nextQty), rate: last?.rate ?? '0' }];
    });

  const removeTier = (idx: number) =>
    setTiers(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  /** Cận trên của 1 bậc = (mốc kế tiếp − 1); null nếu là bậc cao nhất ("trở lên"). */
  const tierUpperOf = (minQ: number): number | null => {
    const greater = tiers
      .map(t => Math.floor(Number(t.minQty) || 0))
      .filter(q => q > minQ);
    return greater.length ? Math.min(...greater) - 1 : null;
  };

  const handleSave = async () => {
    if (!isDirty) return;
    const normalized = normalizeTiers(tiers);
    if (normalized.length === 0) {
      toast.error('Cần ít nhất 1 bậc hoa hồng');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(group.id, {
        name,
        minMargin: Number(minMargin) / 100,
        maxMargin: Number(maxMargin) / 100,
        fallbackRate: Number(fallback) / 100,
        tiers: normalized,
      });
      toast.success(`Đã lưu nhóm "${name}"`);
    } catch {
      toast.error('Không thể lưu nhóm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box layoutClassName="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 dark:text-slate-600" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Tên nhóm"
          containerClassName="flex-1 min-w-0 max-w-xs"
          backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
          borderClassName="border-slate-200 dark:border-slate-600"
          textClassName="text-base font-bold text-slate-900 dark:text-white"
          sizeClassName="py-2"
        />
        <Button
          type="button"
          onClick={() => setShowProducts((v) => !v)}
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          sizeClassName="px-2.5 py-1.5 text-xs"
          roundedClassName="rounded-lg"
          borderClassName="border border-transparent"
          backgroundClassName={
            groupProducts.length > 0
              ? 'bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600'
          }
          textClassName={
            groupProducts.length > 0
              ? 'font-semibold text-primary-700 dark:text-primary-300'
              : 'font-semibold text-slate-500 dark:text-slate-400'
          }
          layoutClassName="inline-flex shrink-0 items-center gap-1"
          title="Xem sản phẩm thuộc nhóm"
        >
          <Package className="h-3.5 w-3.5" />
          <Typography as="span">{groupProducts.length} sp</Typography>
          {showProducts ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        <Button
          type="button"
          disabled={!isDirty || saving}
          onClick={handleSave}
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          leftIcon={saving ? undefined : <Save />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
          sizeClassName="px-2.5 py-1.5 text-xs"
          roundedClassName="rounded-lg"
          borderClassName="border border-transparent"
          backgroundClassName={isDirty ? 'bg-primary-600 hover:bg-primary-700' : 'bg-slate-200 dark:bg-slate-700'}
          textClassName={isDirty ? 'font-semibold text-white' : 'font-semibold text-slate-400 dark:text-slate-500'}
          layoutClassName="inline-flex shrink-0 items-center gap-1"
          stateClassName="transition-colors disabled:cursor-not-allowed"
        >
          {saving ? <ButtonSpinner /> : (isDirty ? 'Lưu' : 'Đã lưu')}
        </Button>
        {canDelete && (
          <Button
            type="button"
            onClick={() => onDelete(group.id)}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            sizeClassName="p-1.5"
            roundedClassName="rounded-lg"
            borderClassName="border border-transparent"
            backgroundClassName="bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
            textClassName="text-slate-400 hover:text-red-500"
            layoutClassName="inline-flex shrink-0"
            stateClassName="transition-colors"
            title="Xoá nhóm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </Box>

      {/* Body */}
      <Box layoutClassName="space-y-4 p-4">
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Margin range */}
          <Box layoutClassName="space-y-1.5">
            <FieldLabel dotClassName="bg-blue-500">% Margin</FieldLabel>
            <Box layoutClassName="flex items-center gap-1.5">
              <Input
                type="number"
                value={minMargin}
                onChange={(e) => setMinMargin(e.target.value)}
                min={0}
                max={99}
                step={1}
                containerClassName="w-16"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                sizeClassName="py-1.5 text-center text-sm font-semibold"
              />
              <Typography as="span" textClassName="text-slate-400">–</Typography>
              <Input
                type="number"
                value={maxMargin}
                onChange={(e) => setMaxMargin(e.target.value)}
                min={1}
                max={100}
                step={1}
                containerClassName="w-16"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                sizeClassName="py-1.5 text-center text-sm font-semibold"
              />
              <Typography as="span" size="xs" textClassName="text-slate-400">%</Typography>
            </Box>
          </Box>

          {/* % Fallback */}
          <Box layoutClassName="space-y-1.5">
            <FieldLabel dotClassName="bg-amber-500">% Fallback</FieldLabel>
            <Box layoutClassName="flex items-center gap-1.5">
              <Input
                type="number"
                value={fallback}
                onChange={(e) => setFallback(e.target.value)}
                min={0}
                max={100}
                step={0.5}
                containerClassName="w-20"
                backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
                borderClassName="border-amber-200 dark:border-amber-700/50"
                sizeClassName="py-1.5 text-center text-sm font-bold"
                textClassName="text-amber-700 dark:text-amber-300"
              />
              <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">% khi không có cost</Typography>
            </Box>
          </Box>
        </Box>

        {/* % Lợi nhuận theo bậc số lượng */}
        <Box layoutClassName="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <FieldLabel dotClassName="bg-emerald-500">% Lợi nhuận theo số lượng (bán/tháng)</FieldLabel>

          <Box layoutClassName="space-y-1.5">
            {tiers.map((t, idx) => {
              const upper = tierUpperOf(Math.floor(Number(t.minQty) || 0));
              return (
              <Box key={idx} layoutClassName="flex flex-wrap items-center gap-2">
                <Typography as="span" size="xs" layoutClassName="w-8 shrink-0" textClassName="text-slate-500 dark:text-slate-400">Từ</Typography>
                <Input
                  type="number"
                  value={t.minQty}
                  onChange={(e) => updateTier(idx, 'minQty', e.target.value)}
                  min={1}
                  step={1}
                  containerClassName="w-16"
                  backgroundClassName="bg-white dark:bg-slate-700/50"
                  sizeClassName="py-1.5 text-center text-sm font-semibold"
                />
                {upper === null ? (
                  <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-500 dark:text-slate-400">trở lên (sp) →</Typography>
                ) : (
                  <Box layoutClassName="flex shrink-0 items-center gap-2">
                    <Typography as="span" size="xs" textClassName="text-slate-400">đến</Typography>
                    <Box layoutClassName="w-16 rounded-md bg-slate-100 py-1.5 dark:bg-slate-700/50">
                      <Typography as="span" size="xs" layoutClassName="block text-center font-semibold" textClassName="text-slate-500 dark:text-slate-400">{upper}</Typography>
                    </Box>
                    <Typography as="span" size="xs" textClassName="text-slate-400">sp →</Typography>
                  </Box>
                )}
                <Input
                  type="number"
                  value={t.rate}
                  onChange={(e) => updateTier(idx, 'rate', e.target.value)}
                  min={0}
                  max={100}
                  step={0.5}
                  containerClassName="w-20"
                  backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
                  borderClassName="border-emerald-200 dark:border-emerald-700/50"
                  sizeClassName="py-1.5 text-center text-sm font-bold"
                  textClassName="text-emerald-700 dark:text-emerald-300"
                />
                <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-500 dark:text-slate-400">% LN</Typography>
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeTier(idx)}
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    sizeClassName="p-1"
                    roundedClassName="rounded-md"
                    borderClassName="border border-transparent"
                    backgroundClassName="bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                    textClassName="text-slate-300 hover:text-red-500"
                    layoutClassName="ml-auto inline-flex shrink-0"
                    stateClassName="transition-colors"
                    title="Xoá bậc"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </Box>
              );
            })}
          </Box>

          <Button
            type="button"
            onClick={addTier}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            sizeClassName="px-2 py-1 text-xs"
            roundedClassName="rounded-lg"
            borderClassName="border border-dashed border-emerald-300 dark:border-emerald-700/60"
            backgroundClassName="bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            textClassName="font-medium text-emerald-700 dark:text-emerald-300"
            layoutClassName="inline-flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm bậc
          </Button>
        </Box>
      </Box>

      {/* Products list */}
      {showProducts && (
        <Box layoutClassName="border-t border-slate-100 dark:border-slate-700">
          {groupProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Chưa có sản phẩm nào thuộc nhóm này (cần nhập giá cost ở tab Sản phẩm)"
            />
          ) : (
            <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
              {groupProducts.map((p) => {
                const profit = p.price - (p.costPrice ?? 0);
                const margin = profit / p.price;
                const commission = calcItemCommission(p.price, p.costPrice, [group]);
                return (
                  <Box key={p.id} layoutClassName="flex items-center gap-3 px-4 py-2.5">
                    <Box layoutClassName="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} layoutClassName="h-full w-full object-cover" />
                      ) : (
                        <Box layoutClassName="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700">?</Box>
                      )}
                    </Box>
                    <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-700 dark:text-slate-300">{p.name}</Typography>
                    <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-400">{formatVND(p.price)}</Typography>
                    <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-400">cost {formatVND(p.costPrice ?? 0)}</Typography>
                    <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-400">margin {pct(margin)}</Typography>
                    <Typography as="span" size="xs" layoutClassName="shrink-0 font-semibold" variant="success">
                      HH từ ~{formatVND(commission)}/sp
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

interface GroupsTabProps {
  groups: CommissionGroup[];
  products: Product[];
  onGroupsChange: (groups: CommissionGroup[]) => void;
}

const GroupsTab: React.FC<GroupsTabProps> = ({ groups, products, onGroupsChange }) => {
  const [adding, setAdding] = useState(false);

  const handleUpdate = async (id: string, data: Partial<Omit<CommissionGroup, 'id'>>) => {
    await updateCommissionGroup(id, data);
    onGroupsChange(groups.map(g => g.id === id ? { ...g, ...data } : g));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá nhóm này?')) return;
    await deleteCommissionGroup(id);
    onGroupsChange(groups.filter(g => g.id !== id));
    toast.success('Đã xoá nhóm');
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const maxOrder = Math.max(0, ...groups.map(g => g.order));
      const newGroup = await createCommissionGroup({
        name: 'Nhóm mới',
        minMargin: 0,
        maxMargin: 1,
        fallbackRate: 0.05,
        tiers: [{ minQty: 1, profitShareRate: 0.1 }, { minQty: 30, profitShareRate: 0.15 }],
        order: maxOrder + 1,
      });
      onGroupsChange([...groups, newGroup]);
      toast.success('Đã tạo nhóm mới');
    } catch {
      toast.error('Không thể tạo nhóm');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box layoutClassName="space-y-4">
      {/* Legend */}
      <Box layoutClassName="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
        <Box layoutClassName="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <Box layoutClassName="space-y-1 text-xs" textClassName="text-blue-700 dark:text-blue-300">
            <Typography as="p" size="xs" textClassName="text-blue-700 dark:text-blue-300"><strong>% Margin</strong>: khoảng biên lợi nhuận để xếp nhóm. VD: margin 30% → nhóm 25–45%.</Typography>
            <Typography as="p" size="xs" textClassName="text-blue-700 dark:text-blue-300"><strong>% Lợi nhuận theo dải số lượng</strong>: chia theo dải SL bán/tháng (VD 1–10, 11–30, ≥30 sp). Cận trên tự suy từ mốc kế tiếp; bậc cuối là "trở lên". Bán càng nhiều (tính theo tháng, từng CTV, đếm riêng từng nhóm) rate càng cao — rơi vào dải nào thì cả số lượng hưởng rate dải đó.</Typography>
            <Typography as="p" size="xs" textClassName="text-blue-700 dark:text-blue-300"><strong>% Fallback</strong>: dùng khi sản phẩm không có giá cost. Commission = Giá × %Fallback.</Typography>
          </Box>
        </Box>
      </Box>

      <Box layoutClassName="space-y-2">
        {groups.map(g => (
          <GroupRow
            key={g.id}
            group={g}
            products={products}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            canDelete={groups.length > 1}
          />
        ))}
      </Box>

      <Button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        layoutClassName="flex w-full items-center justify-center gap-2"
        roundedClassName="rounded-xl"
        borderClassName="border-2 border-dashed border-slate-200 hover:border-primary-400 dark:border-slate-600 dark:hover:border-primary-600"
        sizeClassName="py-3 text-sm"
        textClassName="font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
        stateClassName="transition-colors disabled:opacity-50">
        {adding ? <ButtonSpinner className="border-slate-400" /> : <Plus className="h-4 w-4" />}
        Thêm nhóm
      </Button>
    </Box>
  );
};

export default GroupsTab;
