import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ChevronsUpDown, FileText, PencilLine, ReceiptText, RotateCw, TrendingUp, Upload } from 'lucide-react';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import FilterToolbar, { type ToolbarOption } from '@/components/shared/FilterToolbar';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import { filterByPeriod, PERIOD_OPTIONS, type DatePeriod } from '@/pages/StockReceipts/dateFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDateValue } from '@/utils/format/dateUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import EmptyState from '@/components/ui/EmptyState';

/** Cột có thể sort. */
type SortKey = 'date' | 'total';
type SortDir = 'asc' | 'desc';

/** Mốc thời gian của 1 phiếu: ưu tiên receiptDate, fallback createdAt. */
const receiptSortTime = (row: SavedStockReceiptSummary): number =>
  (parseDateValue(row.receiptDate) ?? parseDateValue(row.createdAt))?.getTime() ?? 0;

/** Ngày hiển thị (dd/mm/yyyy) — ưu tiên receiptDate, fallback createdAt. */
const receiptDateLabel = (row: SavedStockReceiptSummary): string => {
  const d = parseDateValue(row.receiptDate) ?? parseDateValue(row.createdAt);
  if (!d) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Chỉ giờ:phút của 1 phiếu (suy từ createdAt), rỗng nếu không. */
const receiptTimeLabel = (row: SavedStockReceiptSummary): string => {
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
  receiptLoading: boolean;
  onRefresh: () => void;
  filteredReceipts: SavedStockReceiptSummary[];
  onRowClick: (receiptId: string) => void;
  onFileSelected?: (file: File | undefined) => void;
  /** Mở form nhập phiếu THỦ CÔNG (bill viết tay — không OCR). */
  onStartManual?: () => void;
}

const BillImportReceiptListTab: React.FC<BillImportReceiptListTabProps> = ({
  receiptSearch,
  onReceiptSearchChange,
  receiptLoading,
  onRefresh,
  filteredReceipts,
  onRowClick,
  onFileSelected,
  onStartManual,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // (1) state
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [period, setPeriod] = useState<DatePeriod>('all');

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

  // (2b) memo: sort tập đã lọc kỳ theo cột đang chọn
  const sortedReceipts = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...periodFilteredReceipts].sort((a, b) => {
      if (sortKey === 'total') {
        return ((a.totalAmount || 0) - (b.totalAmount || 0)) * dir;
      }
      return (receiptSortTime(a) - receiptSortTime(b)) * dir;
    });
  }, [periodFilteredReceipts, sortKey, sortDir]);

  // (2c) memo: stats của tập đã lọc (số phiếu + tổng tiền)
  const stats = useMemo(() => {
    const totalAmount = periodFilteredReceipts.reduce((s, r) => s + (r.totalAmount || 0), 0);
    return { count: periodFilteredReceipts.length, totalAmount };
  }, [periodFilteredReceipts]);

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

  const openCamera = () => cameraInputRef.current?.click();
  const openFilePicker = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && onFileSelected) onFileSelected(file);
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
    <Box layoutClassName="grid gap-4">
      {onFileSelected ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
        </>
      ) : null}

      {onFileSelected ? (
        <Card
          padding="md"
          borderClassName="border-primary-200 dark:border-primary-900/60"
          backgroundClassName="bg-gradient-to-br from-primary-50 to-primary-50 dark:from-primary-950/40 dark:to-primary-950/30"
          layoutClassName="shadow-sm"
        >
          <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
            <Box layoutClassName="min-w-0">
              <Typography size="sm" layoutClassName="font-semibold text-primary-900 dark:text-primary-100">
                Nhập bill mới
              </Typography>
              <Typography size="xs" variant="muted" layoutClassName="mt-0.5">
                Chụp / tải ảnh hoá đơn để OCR tự đọc, hoặc nhập thủ công khi bill viết tay.
              </Typography>
            </Box>
            <Box layoutClassName="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={openCamera}
                leftIcon={<Camera />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-4 py-2"
                layoutClassName="inline-flex items-center gap-2 whitespace-nowrap"
                disableVariantHover
              >
                Chụp ảnh
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={openFilePicker}
                leftIcon={<Upload />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-4 py-2"
                layoutClassName="inline-flex items-center gap-2 whitespace-nowrap"
                disableVariantHover
                disableVariantTextColor
              >
                Tải ảnh lên
              </Button>
              {onStartManual ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onStartManual()}
                  leftIcon={<PencilLine />}
                  iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                  sizeClassName="px-4 py-2"
                  layoutClassName="inline-flex items-center gap-2 whitespace-nowrap"
                >
                  Nhập thủ công
                </Button>
              ) : null}
            </Box>
          </Box>
        </Card>
      ) : null}

      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex items-center justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Danh sách phiếu đã nhập
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm vào dòng để xem chi tiết bill và ảnh gốc.
            </Typography>
          </Box>
          <Button
            type="button"
            variant="secondary"
            sizeClassName="px-3 py-1.5 text-xs"
            onClick={() => void onRefresh()}
            disabled={receiptLoading}
            leftIcon={<RotateCw />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            layoutClassName="inline-flex items-center gap-1.5"
          >
            {receiptLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </Box>
        <FilterToolbar
          search={receiptSearch}
          onSearchChange={onReceiptSearchChange}
          searchPlaceholder={t('billImport.receiptsSearch')}
          period={period}
          periodOptions={PERIOD_OPTIONS as ToolbarOption[]}
          onPeriodChange={(v) => setPeriod(v as DatePeriod)}
          onClearAll={() => {
            setPeriod('all');
            onReceiptSearchChange('');
          }}
        />
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

        {sortedReceipts.length === 0 ? (
          <Box
            layoutClassName="rounded-lg border border-slate-100 dark:border-slate-800"
          >
            <Box layoutClassName="flex flex-col items-center gap-3 p-6 text-center">
              <EmptyState icon={<FileText className="h-6 w-6" />} title="Chưa có bill nào." />
              {onFileSelected ? (
                <Box layoutClassName="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    sizeClassName="px-3 py-1.5 text-xs"
                    onClick={openCamera}
                    leftIcon={<Camera />}
                    iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    layoutClassName="inline-flex items-center gap-1.5"
                    disableVariantHover
                  >
                    Chụp ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    sizeClassName="px-3 py-1.5 text-xs"
                    onClick={openFilePicker}
                    leftIcon={<Upload />}
                    iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    layoutClassName="inline-flex items-center gap-1.5"
                  >
                    Tải ảnh lên
                  </Button>
                  {onStartManual ? (
                    <Button
                      type="button"
                      variant="ghost"
                      sizeClassName="px-3 py-1.5 text-xs"
                      onClick={() => onStartManual()}
                      leftIcon={<PencilLine />}
                      iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                      layoutClassName="inline-flex items-center gap-1.5"
                    >
                      Nhập thủ công
                    </Button>
                  ) : null}
                </Box>
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
                        {t('billImport.colDateTime')}
                        {sortIcon('date')}
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
                    const time = receiptTimeLabel(row);
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
                          {time ? (
                            <Typography size="xs" variant="muted">
                              {time}
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
                  {/* Trái: NCC + ngày */}
                  <Box layoutClassName="min-w-0 flex-1 space-y-0.5">
                    <Typography size="sm" layoutClassName="truncate font-medium">
                      {row.supplierNameRaw || 'Không rõ NCC'}
                    </Typography>
                    <Typography size="xs" variant="muted">
                      {receiptDateLabel(row)}
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
      </Card>
    </Box>
  );
};

export default BillImportReceiptListTab;
