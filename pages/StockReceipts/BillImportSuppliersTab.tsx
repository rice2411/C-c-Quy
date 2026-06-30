import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GitMerge,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  Store,
  Tag,
  TrendingUp,
  Truck,
  User,
  X,
} from 'lucide-react';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
import { mergeSuppliers } from '@/services/stockReceiptService';
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
import SupplierEditModal from '@/pages/StockReceipts/SupplierEditModal';
import MergeItemsModal, { type MergeItemDescriptor } from '@/pages/StockReceipts/MergeItemsModal';
import EmptyState from '@/components/ui/EmptyState';

import Checkbox from '@/components/ui/Checkbox';
import { formatDateISO } from '@/utils/format/dateUtil';
/** Bậc màu nền/viền theo tổng chi (VND) — primary đậm dần. */
const supplierAmountTier = (
  amount: number,
): { backgroundClassName: string; borderClassName: string } => {
  if (amount >= 20_000_000)
    return {
      backgroundClassName: 'bg-primary-100 dark:bg-primary-900/40',
      borderClassName: 'border-primary-400 dark:border-primary-600',
    };
  if (amount >= 5_000_000)
    return {
      backgroundClassName: 'bg-primary-50 dark:bg-primary-950/40',
      borderClassName: 'border-primary-300 dark:border-primary-700',
    };
  if (amount >= 1_000_000)
    return {
      backgroundClassName: 'bg-primary-50/50 dark:bg-primary-950/20',
      borderClassName: 'border-primary-200 dark:border-primary-800',
    };
  return {
    backgroundClassName: 'bg-white dark:bg-slate-900',
    borderClassName: 'border-slate-200 dark:border-slate-700',
  };
};

export interface BillImportSuppliersTabProps {
  supplierSearch: string;
  onSupplierSearchChange: (value: string) => void;
  masterLoading: boolean;
  onRefresh: () => void;
  filteredSuppliers: ImportedSupplierSummary[];
}

const BillImportSuppliersTab: React.FC<BillImportSuppliersTabProps> = ({
  supplierSearch,
  onSupplierSearchChange,
  masterLoading,
  onRefresh,
  filteredSuppliers,
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<ImportedSupplierSummary | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'name' | 'count'>('recent');
  const [period, setPeriod] = useState<DatePeriod>('all');

  const periodFiltered = useMemo(
    () => filterByPeriod(filteredSuppliers, period),
    [filteredSuppliers, period],
  );

  const sortedSuppliers = useMemo(() => {
    const arr = [...periodFiltered];
    if (sortBy === 'amount') arr.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    else if (sortBy === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'count') arr.sort((a, b) => (b.receiptCount || 0) - (a.receiptCount || 0));
    return arr;
  }, [periodFiltered, sortBy]);

  const stats = useMemo(() => {
    const totalAmount = periodFiltered.reduce((s, sp) => s + (sp.totalAmount || 0), 0);
    const totalReceipts = periodFiltered.reduce((s, sp) => s + (sp.receiptCount || 0), 0);
    return { totalAmount, totalReceipts };
  }, [periodFiltered]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedItems: MergeItemDescriptor[] = filteredSuppliers
    .filter((sp) => selected.has(sp.id))
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      subtitle: `${sp.receiptCount} phiếu · ${formatVNDOrDash(sp.totalAmount)}${sp.phone ? ' · ' + sp.phone : ''}`,
    }));

  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-start justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Nhà cung cấp
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm chi tiết để xem đầy đủ, chọn nhiều để gộp NCC trùng.
            </Typography>
          </Box>
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
              icon: Store,
              label: 'NCC',
              value: String(periodFiltered.length),
              accent: '#4abab9',
            },
            {
              icon: ReceiptText,
              label: 'Phiếu',
              value: String(stats.totalReceipts),
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
          search={supplierSearch}
          onSearchChange={onSupplierSearchChange}
          searchPlaceholder={t('billImport.suppliersSearch')}
          period={period}
          periodOptions={PERIOD_OPTIONS as any}
          onPeriodChange={(v) => setPeriod(v as DatePeriod)}
          sortBy={sortBy}
          sortOptions={[
            { value: 'recent', label: t('billImport.sort.recent') },
            { value: 'amount', label: t('billImport.sort.amount') },
            { value: 'count', label: t('billImport.sort.supplierCount') },
            { value: 'name', label: t('billImport.sort.name') },
          ]}
          onSortChange={(v) => setSortBy(v as any)}
          onClearAll={() => { setPeriod('all'); onSupplierSearchChange(''); }}
        />
        {selected.size >= 1 ? (
          <Typography size="xs" variant="muted">
            Đã chọn {selected.size} NCC.{' '}
            {selected.size < 2 ? 'Chọn thêm để gộp.' : 'Bấm "Gộp" để hợp nhất.'}
          </Typography>
        ) : null}

        {/* ===== CARD GRID (mobile + desktop đồng nhất) ===== */}
        <Box layoutClassName="max-h-[640px] overflow-auto p-1">
          {sortedSuppliers.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="Không có nhà cung cấp phù hợp."
            />
          ) : (
            <Box layoutClassName="grid gap-3 p-1 sm:grid-cols-2 xl:grid-cols-3">
              {sortedSuppliers.map((row) => {
                const isChecked = selected.has(row.id);
                const open = expanded === row.id;
                const tier = supplierAmountTier(row.totalAmount || 0);
                return (
                  <Card
                    key={row.id}
                    padding="md"
                    layoutClassName="space-y-2"
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
                        onChange={() => toggleSelect(row.id)}
                        borderClassName="mt-1 shrink-0 rounded border-slate-300"
                        focusClassName="cursor-pointer text-primary-600 focus:ring-primary-500"
                      />
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography size="sm" layoutClassName="break-words font-semibold">
                          {row.name}
                        </Typography>
                        {row.category ? (
                          <Typography
                            as="span"
                            size="xs"
                            layoutClassName="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700"
                            textClassName="text-[10px] text-slate-700 dark:text-slate-200"
                          >
                            <Tag className="h-3 w-3" /> {row.category}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>

                    <Typography size="lg" layoutClassName="font-bold text-primary-700 dark:text-primary-300">
                      {formatVNDOrDash(row.totalAmount)}
                    </Typography>

                    <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5">
                      <Typography size="xs" variant="muted">
                        {row.receiptCount} phiếu
                      </Typography>
                      {row.lastReceiptDate ? (
                        <Typography size="xs" variant="muted">
                          🕒 {formatDateISO(row.lastReceiptDate)}
                        </Typography>
                      ) : null}
                      {row.phone ? (
                        <Typography size="xs" variant="muted">
                          📞 {row.phone}
                        </Typography>
                      ) : null}
                    </Box>

                    <Box layoutClassName="flex gap-2 border-t border-slate-100 pt-2 dark:border-slate-700/60">
                      <Button
                        type="button"
                        variant="ghost"
                        sizeClassName="px-2 py-1 text-xs"
                        onClick={() => setExpanded(open ? null : row.id)}
                        leftIcon={open ? <ChevronDown /> : <ChevronRight />}
                        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                        layoutClassName="inline-flex items-center gap-1"
                      >
                        {open ? 'Thu gọn' : 'Chi tiết'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        sizeClassName="px-2 py-1 text-xs"
                        onClick={() => setEditing(row)}
                        leftIcon={<Pencil />}
                        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                        layoutClassName="inline-flex items-center gap-1"
                      >
                        Sửa
                      </Button>
                    </Box>

                    {open ? (
                      <Box
                        layoutClassName="grid gap-2 rounded-md p-2 text-xs"
                        backgroundClassName="bg-slate-50 dark:bg-slate-800/50"
                      >
                        <Box layoutClassName="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                          <Typography as="span" size="xs">{row.phone || '—'}</Typography>
                        </Box>
                        <Box layoutClassName="flex items-center gap-1.5">
                          <User className="h-3 w-3 shrink-0 text-slate-400" />
                          <Typography as="span" size="xs">{row.contactPerson || '—'}</Typography>
                        </Box>
                        {row.email ? (
                          <Box layoutClassName="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <Typography as="span" size="xs">{row.email}</Typography>
                          </Box>
                        ) : null}
                        {row.taxCode ? (
                          <Box layoutClassName="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 shrink-0 text-slate-400" />
                            <Typography as="span" size="xs">MST: {row.taxCode}</Typography>
                          </Box>
                        ) : null}
                        {row.address ? (
                          <Box layoutClassName="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                            <Typography as="span" size="xs" layoutClassName="break-words">{row.address}</Typography>
                          </Box>
                        ) : null}
                        {row.notes ? (
                          <Box
                            layoutClassName="rounded p-1.5"
                            backgroundClassName="bg-amber-50 dark:bg-amber-950/40"
                          >
                            <Typography as="span" size="xs">💬 {row.notes}</Typography>
                          </Box>
                        ) : null}
                      </Box>
                    ) : null}
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Card>

      <SupplierEditModal
        open={editing !== null}
        supplier={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void onRefresh();
        }}
      />

      <MergeItemsModal
        open={mergeOpen}
        itemTypeLabel="nhà cung cấp"
        items={selectedItems}
        onClose={() => setMergeOpen(false)}
        onConfirm={mergeSuppliers}
        onDone={() => {
          clearSelection();
          void onRefresh();
        }}
      />
    </Box>
  );
};

export default BillImportSuppliersTab;
