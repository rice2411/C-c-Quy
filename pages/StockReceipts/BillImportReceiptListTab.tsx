import React, { useMemo, useRef } from 'react';
import { Camera, FileText, PencilLine, RotateCw, Upload } from 'lucide-react';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDateValue } from '@/utils/format/dateUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import EmptyState from '@/components/ui/EmptyState';

/** Ngày để gom nhóm 1 phiếu: ưu tiên receiptDate, fallback createdAt. */
const receiptGroupDate = (row: SavedStockReceiptSummary): Date | null =>
  parseDateValue(row.receiptDate) ?? parseDateValue(row.createdAt);

/** Khoá nhóm theo ngày (yyyy-mm-dd local) để sort ổn định. */
const dayKey = (d: Date | null): string => {
  if (!d) return '0000-00-00';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/** Nhãn heading ngày (vd "Thứ 2, 30/06/2026"). */
const dayHeading = (key: string): string => {
  if (key === '0000-00-00') return 'Không rõ ngày';
  const d = parseDateValue(key);
  if (!d) return key;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Chỉ giờ:phút của 1 phiếu (nếu suy được từ createdAt), rỗng nếu không. */
const receiptTimeLabel = (row: SavedStockReceiptSummary): string => {
  const d = parseDateValue(row.createdAt);
  if (!d) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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

  /** Gom phiếu theo ngày (giảm dần), trong mỗi ngày sắp theo giờ giảm dần. */
  const groupedByDay = useMemo(() => {
    const map = new Map<string, SavedStockReceiptSummary[]>();
    for (const row of filteredReceipts) {
      const key = dayKey(receiptGroupDate(row));
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => ({
        key,
        heading: dayHeading(key),
        rows: [...rows].sort((r1, r2) => {
          const t1 = parseDateValue(r1.createdAt)?.getTime() ?? 0;
          const t2 = parseDateValue(r2.createdAt)?.getTime() ?? 0;
          return t2 - t1;
        }),
        total: rows.reduce((s, r) => s + (r.totalAmount || 0), 0),
      }));
  }, [filteredReceipts]);

  const openCamera = () => cameraInputRef.current?.click();
  const openFilePicker = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && onFileSelected) onFileSelected(file);
  };

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
        />
        <Box layoutClassName="max-h-[640px] overflow-auto rounded-lg border border-slate-100 p-1 dark:border-slate-800">
          {filteredReceipts.length === 0 ? (
            <Box layoutClassName="flex flex-col items-center gap-3 p-6 text-center">
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="Chưa có bill nào."
              />
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
          ) : (
            <Box layoutClassName="space-y-4 p-1">
              {groupedByDay.map((group) => (
                <Box key={group.key} layoutClassName="space-y-1.5">
                  {/* Heading ngày */}
                  <Box layoutClassName="flex items-baseline justify-between gap-2 px-1">
                    <Typography
                      size="xs"
                      layoutClassName="font-semibold uppercase tracking-wide"
                      textClassName="text-slate-500 dark:text-slate-400"
                    >
                      {group.heading}
                    </Typography>
                    <Typography size="xs" variant="muted">
                      {group.rows.length} phiếu · {formatVNDOrDash(group.total)}
                    </Typography>
                  </Box>

                  {/* Danh sách dòng phiếu trong ngày */}
                  <Box
                    layoutClassName="divide-y overflow-hidden rounded-lg border"
                    borderClassName="divide-slate-100 border-slate-200 dark:divide-slate-800 dark:border-slate-700"
                  >
                    {group.rows.map((row) => {
                      const time = receiptTimeLabel(row);
                      return (
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
                          {/* Trái: NCC + (mã HĐ + giờ) */}
                          <Box layoutClassName="min-w-0 flex-1 space-y-0.5">
                            <Typography size="sm" layoutClassName="truncate font-medium">
                              {row.supplierNameRaw || 'Không rõ NCC'}
                            </Typography>
                            <Box layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {row.invoiceNumber ? (
                                <Typography
                                  as="span"
                                  size="xs"
                                  layoutClassName="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800"
                                  textClassName="font-mono text-[10px] text-slate-600 dark:text-slate-300"
                                >
                                  {row.invoiceNumber}
                                </Typography>
                              ) : null}
                              {time ? (
                                <Typography size="xs" variant="muted">
                                  {time}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>

                          {/* Phải: tổng tiền đậm + số mặt hàng */}
                          <Box layoutClassName="shrink-0 text-right">
                            <Typography
                              size="sm"
                              layoutClassName="font-bold text-primary-700 dark:text-primary-300"
                            >
                              {formatVNDOrDash(row.totalAmount)}
                            </Typography>
                            <Typography size="xs" variant="muted">
                              {row.productLineCount} mặt hàng
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default BillImportReceiptListTab;
