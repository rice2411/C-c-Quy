import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, FileText, GitCompareArrows, PencilLine, Plus, ReceiptText, ScanLine, TrendingUp } from 'lucide-react';
import ReceiptReconcileModal from './ReceiptReconcileModal';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import FilterToolbar, { type ToolbarOption, type ToolbarPill } from '@/components/shared/FilterToolbar';
import StatsBanner from '@/components/ui/StatsBanner';
import { filterByPeriod, PERIOD_OPTIONS, type DatePeriod } from '@/pages/StockReceipts/dateFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDateValue } from '@/utils/format/dateUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import EmptyState from '@/components/ui/EmptyState';

/** Cột có thể sort. */
type SortKey = 'date' | 'created' | 'total';
type SortDir = 'asc' | 'desc';

/** Mốc thời gian của 1 phiếu: ưu tiên receiptDate, fallback createdAt. */
const receiptSortTime = (row: SavedStockReceiptSummary): number =>
  (parseDateValue(row.receiptDate) ?? parseDateValue(row.createdAt))?.getTime() ?? 0;

/** Mốc thời gian "lên hệ thống" (createdAt) — dùng để sort cột ngày tạo phiếu. */
const createdSortTime = (row: SavedStockReceiptSummary): number =>
  parseDateValue(row.createdAt)?.getTime() ?? 0;

/** Ngày hiển thị (dd/mm/yyyy) — ưu tiên receiptDate, fallback createdAt. */
const receiptDateLabel = (row: SavedStockReceiptSummary): string => {
  const d = parseDateValue(row.receiptDate) ?? parseDateValue(row.createdAt);
  if (!d) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Ngày lên hệ thống (dd/mm/yyyy) — chỉ từ createdAt. */
const createdDateLabel = (row: SavedStockReceiptSummary): string => {
  const d = parseDateValue(row.createdAt);
  if (!d) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Chỉ giờ:phút "lên hệ thống" (suy từ createdAt), rỗng nếu không. */
const createdTimeLabel = (row: SavedStockReceiptSummary): string => {
  const d = parseDateValue(row.createdAt);
  if (!d) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/** Màu badge theo nguồn (tách backgroundClassName / textClassName — KHÔNG className gộp). */
const sourceBadgeColor = (
  source: SavedStockReceiptSummary['source'],
): { backgroundClassName: string; textClassName: string } =>
  source === 'manual'
    ? {
        backgroundClassName: 'bg-slate-100 dark:bg-slate-700',
        textClassName: 'text-slate-700 dark:text-slate-200',
      }
    : {
        backgroundClassName: 'bg-emerald-100 dark:bg-emerald-950/50',
        textClassName: 'text-emerald-700 dark:text-emerald-300',
      };

export interface BillImportReceiptListTabProps {
  receiptSearch: string;
  onReceiptSearchChange: (value: string) => void;
  filteredReceipts: SavedStockReceiptSummary[];
  onRowClick: (receiptId: string) => void;
  /** Mở modal chọn nguồn nhập phiếu (dropzone / chụp / tải / thủ công). */
  onStartImport?: () => void;
  /** Gọi sau khi đối soát thay đổi (để parent refetch danh sách phiếu). */
  onReconciled?: () => void;
}

const BillImportReceiptListTab: React.FC<BillImportReceiptListTabProps> = ({
  receiptSearch,
  onReceiptSearchChange,
  filteredReceipts,
  onRowClick,
  onStartImport,
  onReconciled,
}) => {
  const { t } = useLanguage();

  // (1) state — mặc định sort theo ngày lên hệ thống (createdAt) mới nhất trước.
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [period, setPeriod] = useState<DatePeriod>('all');
  const [reconcileOpen, setReconcileOpen] = useState(false);
  // Pill lọc nhanh (giống trang Đơn hàng): đối soát + nguồn tạo phiếu.
  const [unreconciledOnly, setUnreconciledOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'ocr'>('all');

  // (2a) memo: lọc kỳ — ngày phiếu = receiptDate || createdAt (dùng filterByPeriod như NCC).
  // Bọc mỗi phiếu thành { row, lastReceiptDate } để tái dùng helper rồi map ngược về row gốc.
  const periodFilteredReceipts = useMemo(() => {
    type Wrapped = { row: SavedStockReceiptSummary; lastReceiptDate?: string };
    const wrapped: Wrapped[] = filteredReceipts.map((row) => ({
      row,
      lastReceiptDate: row.receiptDate ?? row.createdAt ?? undefined,
    }));
    return filterByPeriod(wrapped, period).map((w) => w.row);
  }, [filteredReceipts, period]);

  // (2a') memo: lọc theo pill nhanh — đối soát + nguồn tạo phiếu.
  // reconciled có thể undefined (BE bổ sung song song) → coi như CHƯA đối soát.
  const pillFilteredReceipts = useMemo(() => {
    return periodFilteredReceipts.filter((r) => {
      if (unreconciledOnly && r.reconciled === true) return false;
      if (sourceFilter === 'manual' && r.source !== 'manual') return false;
      if (sourceFilter === 'ocr' && r.source === 'manual') return false;
      return true;
    });
  }, [periodFilteredReceipts, unreconciledOnly, sourceFilter]);

  // (2b) memo: sort tập đã lọc theo cột đang chọn
  const sortedReceipts = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...pillFilteredReceipts].sort((a, b) => {
      if (sortKey === 'total') {
        return ((a.totalAmount || 0) - (b.totalAmount || 0)) * dir;
      }
      if (sortKey === 'created') {
        return (createdSortTime(a) - createdSortTime(b)) * dir;
      }
      return (receiptSortTime(a) - receiptSortTime(b)) * dir;
    });
  }, [pillFilteredReceipts, sortKey, sortDir]);

  // (2c) memo: stats của tập đã lọc (số phiếu + tổng tiền)
  const stats = useMemo(() => {
    const totalAmount = pillFilteredReceipts.reduce((s, r) => s + (r.totalAmount || 0), 0);
    return { count: pillFilteredReceipts.length, totalAmount };
  }, [pillFilteredReceipts]);

  // (3) handler
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  // Dropdown sắp xếp trong toolbar (đồng bộ với sort ở header cột).
  const SORT_OPTIONS: ToolbarOption[] = [
    { value: 'created-desc', label: 'Mới nhập' },
    { value: 'created-asc', label: 'Cũ nhất' },
    { value: 'date-desc', label: 'Ngày phiếu: mới → cũ' },
    { value: 'date-asc', label: 'Ngày phiếu: cũ → mới' },
    { value: 'total-desc', label: 'Tiền: cao → thấp' },
    { value: 'total-asc', label: 'Tiền: thấp → cao' },
  ];
  const sortValue = `${sortKey}-${sortDir}`;
  const onSortSelect = (v: string) => {
    const [k, d] = v.split('-');
    setSortKey(k as SortKey);
    setSortDir(d as SortDir);
  };

  const pills: ToolbarPill[] = [
    {
      id: 'unreconciled',
      label: 'Chưa đối soát',
      active: unreconciledOnly,
      onClick: () => setUnreconciledOnly((v) => !v),
      icon: GitCompareArrows,
    },
    {
      id: 'manual',
      label: 'Nhập tay',
      active: sourceFilter === 'manual',
      onClick: () => setSourceFilter((s) => (s === 'manual' ? 'all' : 'manual')),
      icon: PencilLine,
    },
    {
      id: 'ocr',
      label: 'Từ ảnh',
      active: sourceFilter === 'ocr',
      onClick: () => setSourceFilter((s) => (s === 'ocr' ? 'all' : 'ocr')),
      icon: ScanLine,
    },
  ];

  const clearAll = () => {
    setPeriod('all');
    setUnreconciledOnly(false);
    setSourceFilter('all');
    onReceiptSearchChange('');
  };

  const renderSourceBadge = (row: SavedStockReceiptSummary) => {
    const color = sourceBadgeColor(row.source);
    return (
      <Badge
        size="sm"
        backgroundClassName={color.backgroundClassName}
        textClassName={color.textClassName}
        borderClassName="border-transparent"
      >
        {row.source === 'manual' ? t('billImport.sourceManual') : t('billImport.sourceOcr')}
      </Badge>
    );
  };

  // (4) render
  return (
    <Box layoutClassName="space-y-3">
      <StatsBanner
        items={[
          {
            icon: ReceiptText,
            label: t('billImport.statReceiptCount'),
            value: String(stats.count),
            accent: '#0ea5e9',
          },
          {
            icon: TrendingUp,
            label: t('billImport.statTotalAmount'),
            value: formatVNDOrDash(stats.totalAmount),
            accent: '#16a34a',
          },
        ]}
      />

      <FilterToolbar
        search={receiptSearch}
        onSearchChange={onReceiptSearchChange}
        searchPlaceholder={t('billImport.receiptsSearch')}
        period={period}
        periodOptions={PERIOD_OPTIONS as ToolbarOption[]}
        onPeriodChange={(v) => setPeriod(v as DatePeriod)}
        sortBy={sortValue}
        sortOptions={SORT_OPTIONS}
        onSortChange={onSortSelect}
        pills={pills}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReconcileOpen(true)}
              leftIcon={<GitCompareArrows />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-4 py-2"
              roundedClassName="rounded-xl"
              layoutClassName="inline-flex items-center gap-1.5"
            >
              Đối soát
            </Button>
            {onStartImport ? (
              <Button
                type="button"
                onClick={() => onStartImport()}
                leftIcon={<Plus />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-4 py-2"
                backgroundClassName="bg-primary-600 hover:bg-primary-700"
                textClassName="font-medium text-white"
                roundedClassName="rounded-xl"
                borderClassName="border border-transparent"
                layoutClassName="inline-flex items-center gap-1.5"
                disableVariantHover
                disableVariantTextColor
              >
                Nhập
              </Button>
            ) : null}
          </>
        }
        stats={
          <Typography size="xs" variant="muted" layoutClassName="text-right">
            {sortedReceipts.length} / {filteredReceipts.length} phiếu
          </Typography>
        }
        onClearAll={clearAll}
      />

        {sortedReceipts.length === 0 ? (
          <Box
            layoutClassName="rounded-lg border border-slate-100 dark:border-slate-800"
          >
            <Box layoutClassName="flex flex-col items-center gap-3 p-6 text-center">
              <EmptyState icon={<FileText className="h-6 w-6" />} title="Chưa có bill nào." />
              {onStartImport ? (
                <Button
                  type="button"
                  variant="primary"
                  sizeClassName="px-4 py-2 text-xs"
                  onClick={() => onStartImport()}
                  leftIcon={<Plus />}
                  iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  layoutClassName="inline-flex items-center gap-1.5"
                  disableVariantHover
                >
                  Nhập phiếu
                </Button>
              ) : null}
            </Box>
          </Box>
        ) : (
          <>
            {/* Desktop (md+): bảng giao dịch */}
            <Box
              layoutClassName="hidden max-h-[640px] overflow-auto rounded-lg border md:block"
              borderClassName="border-slate-200 dark:border-slate-700"
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell layoutClassName="px-4 py-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        borderClassName="border-transparent"
                        sizeClassName="px-0 py-0 text-xs"
                        layoutClassName="inline-flex items-center gap-1 font-medium uppercase"
                        onClick={() => toggleSort('date')}
                      >
                        {t('billImport.colReceiptDate')}
                        {sortIcon('date')}
                      </Button>
                    </TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        borderClassName="border-transparent"
                        sizeClassName="px-0 py-0 text-xs"
                        layoutClassName="inline-flex items-center gap-1 font-medium uppercase"
                        onClick={() => toggleSort('created')}
                      >
                        {t('billImport.colCreatedAt')}
                        {sortIcon('created')}
                      </Button>
                    </TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5">{t('billImport.colSupplier')}</TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5">{t('billImport.colInvoice')}</TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5 text-right">
                      {t('billImport.colItemCount')}
                    </TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5">{t('billImport.colSource')}</TableHeaderCell>
                    <TableHeaderCell layoutClassName="px-4 py-2.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        borderClassName="border-transparent"
                        sizeClassName="px-0 py-0 text-xs"
                        layoutClassName="inline-flex items-center gap-1 font-medium uppercase"
                        onClick={() => toggleSort('total')}
                      >
                        {t('billImport.colTotal')}
                        {sortIcon('total')}
                      </Button>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedReceipts.map((row) => {
                    const createdTime = createdTimeLabel(row);
                    return (
                      <TableRow
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => void onRowClick(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            void onRowClick(row.id);
                          }
                        }}
                        layoutClassName="cursor-pointer"
                        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <TableCell layoutClassName="px-4 py-3 whitespace-nowrap">
                          <Typography size="sm" layoutClassName="font-medium">
                            {receiptDateLabel(row)}
                          </Typography>
                        </TableCell>
                        <TableCell layoutClassName="px-4 py-3 whitespace-nowrap">
                          <Typography size="sm" layoutClassName="font-medium">
                            {createdDateLabel(row)}
                          </Typography>
                          {createdTime ? (
                            <Typography size="xs" variant="muted">
                              {createdTime}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell layoutClassName="px-4 py-3">
                          <Typography size="sm" layoutClassName="max-w-[220px] truncate">
                            {row.supplierNameRaw || 'Không rõ NCC'}
                          </Typography>
                        </TableCell>
                        <TableCell layoutClassName="px-4 py-3">
                          {row.invoiceNumber ? (
                            <Typography
                              as="span"
                              size="xs"
                              textClassName="font-mono text-slate-600 dark:text-slate-300"
                            >
                              {row.invoiceNumber}
                            </Typography>
                          ) : (
                            <Typography as="span" size="sm" variant="muted">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell layoutClassName="px-4 py-3 text-right">
                          <Typography size="sm" layoutClassName="tabular-nums">
                            {row.productLineCount}
                          </Typography>
                        </TableCell>
                        <TableCell layoutClassName="px-4 py-3">{renderSourceBadge(row)}</TableCell>
                        <TableCell layoutClassName="px-4 py-3 text-right whitespace-nowrap">
                          <Typography
                            size="sm"
                            layoutClassName="font-bold tabular-nums text-primary-700 dark:text-primary-300"
                          >
                            {formatVNDOrDash(row.totalAmount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile (<md): dòng gọn */}
            <Box
              layoutClassName="max-h-[640px] divide-y overflow-auto rounded-lg border md:hidden"
              borderClassName="divide-slate-100 border-slate-200 dark:divide-slate-800 dark:border-slate-700"
            >
              {sortedReceipts.map((row) => (
                <Box
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void onRowClick(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void onRowClick(row.id);
                    }
                  }}
                  layoutClassName="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5"
                  backgroundClassName="bg-white dark:bg-slate-900"
                  hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  {/* Trái: NCC + ngày nhập + ngày lên hệ thống */}
                  <Box layoutClassName="min-w-0 flex-1 space-y-0.5">
                    <Typography size="sm" layoutClassName="truncate font-medium">
                      {row.supplierNameRaw || 'Không rõ NCC'}
                    </Typography>
                    <Typography size="xs" variant="muted">
                      {t('billImport.colReceiptDate')}: {receiptDateLabel(row)}
                    </Typography>
                    <Typography size="xs" variant="muted">
                      {t('billImport.colCreatedAt')}: {createdDateLabel(row)}
                    </Typography>
                  </Box>

                  {/* Phải: tổng tiền + số mặt hàng + badge nguồn */}
                  <Box layoutClassName="flex shrink-0 flex-col items-end gap-1">
                    <Typography size="sm" layoutClassName="font-bold text-primary-700 dark:text-primary-300">
                      {formatVNDOrDash(row.totalAmount)}
                    </Typography>
                    <Box layoutClassName="flex items-center gap-1.5">
                      <Typography size="xs" variant="muted">
                        {t('billImport.itemsCount').replace('{{count}}', String(row.productLineCount))}
                      </Typography>
                      {renderSourceBadge(row)}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}

      <ReceiptReconcileModal
        isOpen={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        onApplied={onReconciled}
      />
    </Box>
  );
};

export default BillImportReceiptListTab;
