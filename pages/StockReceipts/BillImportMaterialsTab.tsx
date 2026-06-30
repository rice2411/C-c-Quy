import React, { useMemo, useState } from 'react';
import { GitMerge, Package, ShoppingBag, TrendingUp, X } from 'lucide-react';
import type { ImportedMaterialSummary } from '@/types/billReceipt';
import { mergeMaterials } from '@/services/stockReceiptService';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import { filterByPeriod, PERIOD_OPTIONS, type DatePeriod } from '@/pages/StockReceipts/dateFilter';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import { formatDateISO, parseDateValue } from '@/utils/format/dateUtil';
import MergeItemsModal, { type MergeItemDescriptor } from '@/pages/StockReceipts/MergeItemsModal';
import EmptyState from '@/components/ui/EmptyState';

import Checkbox from '@/components/ui/Checkbox';

/** Mức độ "tươi mới" theo lần nhập cuối → màu xanh/vàng/đỏ. */
const materialRecencyTier = (
  lastReceiptDate?: string,
): {
  backgroundClassName: string;
  borderClassName: string;
  badgeBackgroundClassName: string;
  badgeTextClassName: string;
  label: string;
} => {
  const parsed = parseDateValue(lastReceiptDate);
  const days = parsed ? Math.floor((Date.now() - parsed.getTime()) / 86_400_000) : Infinity;
  if (days < 30)
    return {
      backgroundClassName: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      borderClassName: 'border-l-emerald-500 border-slate-200 dark:border-slate-700 dark:border-l-emerald-500',
      badgeBackgroundClassName: 'bg-emerald-100 dark:bg-emerald-950/50',
      badgeTextClassName: 'text-[10px] font-medium text-emerald-700 dark:text-emerald-300',
      label: 'Mới nhập',
    };
  if (days <= 60)
    return {
      backgroundClassName: 'bg-amber-50/60 dark:bg-amber-950/20',
      borderClassName: 'border-l-amber-500 border-slate-200 dark:border-slate-700 dark:border-l-amber-500',
      badgeBackgroundClassName: 'bg-amber-100 dark:bg-amber-950/50',
      badgeTextClassName: 'text-[10px] font-medium text-amber-700 dark:text-amber-300',
      label: 'Khá lâu',
    };
  return {
    backgroundClassName: 'bg-rose-50/50 dark:bg-rose-950/20',
    borderClassName: 'border-l-rose-500 border-slate-200 dark:border-slate-700 dark:border-l-rose-500',
    badgeBackgroundClassName: 'bg-rose-100 dark:bg-rose-950/50',
    badgeTextClassName: 'text-[10px] font-medium text-rose-700 dark:text-rose-300',
    label: 'Lâu chưa nhập',
  };
};
export interface BillImportMaterialsTabProps {
  materialSearch: string;
  onMaterialSearchChange: (value: string) => void;
  masterLoading: boolean;
  onRefresh: () => void;
  filteredMaterials: ImportedMaterialSummary[];
}

const BillImportMaterialsTab: React.FC<BillImportMaterialsTabProps> = ({
  materialSearch,
  onMaterialSearchChange,
  masterLoading,
  onRefresh,
  filteredMaterials,
}) => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'name' | 'count'>('recent');
  const [period, setPeriod] = useState<DatePeriod>('all');

  // Apply period filter first, then sort
  const periodFiltered = useMemo(
    () => filterByPeriod(filteredMaterials, period),
    [filteredMaterials, period],
  );

  const sortedMaterials = useMemo(() => {
    const arr = [...periodFiltered];
    if (sortBy === 'amount') arr.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    else if (sortBy === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'count') arr.sort((a, b) => (b.importCount || 0) - (a.importCount || 0));
    return arr;
  }, [periodFiltered, sortBy]);

  // Stats tính từ periodFiltered (phản ánh đúng filter người dùng đang xem)
  const stats = useMemo(() => {
    const totalAmount = periodFiltered.reduce((s, m) => s + (m.totalAmount || 0), 0);
    const totalQty = periodFiltered.reduce((s, m) => s + (m.totalQty || 0), 0);
    const totalCount = periodFiltered.reduce((s, m) => s + (m.importCount || 0), 0);
    return { totalAmount, totalQty, totalCount };
  }, [periodFiltered]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedItems: MergeItemDescriptor[] = filteredMaterials
    .filter((m) => selected.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      subtitle: `${m.importCount} lần · ${m.totalQty} sp · ${formatVNDOrDash(m.totalAmount)}`,
    }));

  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Typography size="sm" layoutClassName="font-semibold">
            Nguyên vật liệu đã nhập
          </Typography>
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            {selected.size >= 2 ? (
              <Button
                type="button"
                onClick={() => setMergeOpen(true)}
                leftIcon={<GitMerge />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                sizeClassName="px-3 py-1.5 text-xs"
                backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-600"
                textClassName="font-semibold text-white"
                roundedClassName="rounded-lg"
                layoutClassName="inline-flex items-center gap-1.5"
                disableVariantHover
                disableVariantTextColor
              >
                Gộp {selected.size}
              </Button>
            ) : null}
            {selected.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearSelection}
                leftIcon={<X />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                sizeClassName="px-2 py-1.5 text-xs"
              >
                Bỏ chọn
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              sizeClassName="px-3 py-1.5 text-xs"
              onClick={() => void onRefresh()}
              disabled={masterLoading}
            >
              {masterLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </Box>
        </Box>
        <StatsBanner
          items={[
            {
              icon: Package,
              label: 'Loại NVL',
              value: String(periodFiltered.length),
              accent: '#4abab9',
            },
            {
              icon: ShoppingBag,
              label: 'Lần nhập',
              value: String(stats.totalCount),
              accent: '#0ea5e9',
            },
            {
              icon: TrendingUp,
              label: 'Tổng chi',
              value: formatVNDOrDash(stats.totalAmount),
              accent: '#16a34a',
            },
          ]}
        />
        <FilterToolbar
          search={materialSearch}
          onSearchChange={onMaterialSearchChange}
          searchPlaceholder={t('billImport.materialsSearch')}
          period={period}
          periodOptions={PERIOD_OPTIONS as any}
          onPeriodChange={(v) => setPeriod(v as DatePeriod)}
          sortBy={sortBy}
          sortOptions={[
            { value: 'recent', label: t('billImport.sort.recent') },
            { value: 'amount', label: t('billImport.sort.amount') },
            { value: 'count', label: t('billImport.sort.materialCount') },
            { value: 'name', label: t('billImport.sort.name') },
          ]}
          onSortChange={(v) => setSortBy(v as any)}
          onClearAll={() => { setPeriod('all'); onMaterialSearchChange(''); }}
        />
        {selected.size >= 1 ? (
          <Typography size="xs" variant="muted">
            Đã chọn {selected.size} mục.{' '}
            {selected.size < 2 ? 'Chọn thêm để gộp.' : 'Bấm "Gộp" để hợp nhất.'}
          </Typography>
        ) : null}

        {/* ===== CARD GRID (mobile + desktop đồng nhất) ===== */}
        <Box layoutClassName="max-h-[640px] overflow-auto p-1">
          {sortedMaterials.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Không có nguyên vật liệu phù hợp."
            />
          ) : (
            <Box layoutClassName="grid gap-3 p-1 sm:grid-cols-2 xl:grid-cols-3">
              {sortedMaterials.map((row) => {
                const isChecked = selected.has(row.id);
                const tier = materialRecencyTier(row.lastReceiptDate);
                return (
                  <Card
                    key={row.id}
                    padding="md"
                    layoutClassName={isChecked ? 'space-y-2' : 'space-y-2 border-l-4'}
                    backgroundClassName={isChecked ? 'bg-primary-50/70 dark:bg-primary-950/30' : tier.backgroundClassName}
                    borderClassName={
                      isChecked
                        ? 'border-2 border-primary-400 dark:border-primary-600'
                        : tier.borderClassName
                    }
                  >
                    <Box layoutClassName="flex items-start gap-2">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggle(row.id)}
                        borderClassName="mt-1 shrink-0 rounded border-slate-300"
                        focusClassName="cursor-pointer text-primary-600 focus:ring-primary-500"
                      />
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography size="sm" layoutClassName="break-words font-semibold">
                          {row.name}
                        </Typography>
                        {row.lastSupplierName ? (
                          <Typography size="xs" variant="muted" layoutClassName="truncate">
                            🏭 {row.lastSupplierName}
                          </Typography>
                        ) : null}
                      </Box>
                      <Typography
                        as="span"
                        size="xs"
                        layoutClassName="inline-flex shrink-0 items-center rounded-full px-2 py-0.5"
                        backgroundClassName={tier.badgeBackgroundClassName}
                        textClassName={tier.badgeTextClassName}
                      >
                        {tier.label}
                      </Typography>
                    </Box>

                    <Box layoutClassName="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <Typography size="lg" layoutClassName="font-bold text-primary-700 dark:text-primary-300">
                        {row.totalQty}
                      </Typography>
                      <Typography size="xs" variant="muted">
                        {row.canonicalUnit || ''}
                      </Typography>
                    </Box>

                    <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5">
                      <Typography size="xs" variant="muted">
                        Giá gần nhất:{' '}
                        <Typography as="span" textClassName="font-semibold text-slate-700 dark:text-slate-100">
                          {formatVNDOrDash(row.lastUnitPrice)}
                        </Typography>
                      </Typography>
                      <Typography size="xs" variant="muted">
                        {row.importCount} lần nhập
                      </Typography>
                      {row.lastReceiptDate ? (
                        <Typography size="xs" variant="muted">
                          🕒 {formatDateISO(row.lastReceiptDate)}
                        </Typography>
                      ) : null}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Card>

      <MergeItemsModal
        open={mergeOpen}
        itemTypeLabel="nguyên liệu"
        items={selectedItems}
        onClose={() => setMergeOpen(false)}
        onConfirm={mergeMaterials}
        onDone={() => {
          clearSelection();
          void onRefresh();
        }}
      />
    </Box>
  );
};

export default BillImportMaterialsTab;
