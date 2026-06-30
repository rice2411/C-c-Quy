import React, { useRef } from 'react';
import { Camera, FileText, PencilLine, RotateCw, Upload } from 'lucide-react';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatImportedAt } from '@/utils/format/dateUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import EmptyState from '@/components/ui/EmptyState';

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
            <Box layoutClassName="grid gap-3 p-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredReceipts.map((row) => {
                const isReconciled = row.reconciled === true;
                return (
                  <Card
                    key={row.id}
                    padding="md"
                    role="button"
                    tabIndex={0}
                    onClick={() => void onRowClick(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void onRowClick(row.id);
                      }
                    }}
                    layoutClassName="cursor-pointer space-y-2 border-l-4"
                    borderClassName={
                      isReconciled
                        ? 'border-l-emerald-500 border-slate-200 dark:border-slate-700 dark:border-l-emerald-500'
                        : 'border-l-amber-500 border-slate-200 dark:border-slate-700 dark:border-l-amber-500'
                    }
                    hoverClassName="hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <Box layoutClassName="flex items-start justify-between gap-2">
                      <Typography size="sm" layoutClassName="min-w-0 break-words font-semibold">
                        {row.supplierNameRaw || 'Không rõ NCC'}
                      </Typography>
                      <Typography
                        as="span"
                        size="xs"
                        layoutClassName="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5"
                        backgroundClassName={
                          isReconciled
                            ? 'bg-emerald-100 dark:bg-emerald-950/50'
                            : 'bg-amber-100 dark:bg-amber-950/50'
                        }
                        textClassName={
                          isReconciled
                            ? 'text-[10px] font-medium text-emerald-700 dark:text-emerald-300'
                            : 'text-[10px] font-medium text-amber-700 dark:text-amber-300'
                        }
                      >
                        {isReconciled ? 'Đã đối soát' : 'Chưa đối soát'}
                      </Typography>
                    </Box>
                    <Typography size="lg" layoutClassName="font-bold text-primary-700 dark:text-primary-300">
                      {formatVNDOrDash(row.totalAmount)}
                    </Typography>
                    <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5">
                      <Typography size="xs" variant="muted">
                        {row.receiptDate || formatImportedAt(row.createdAt)}
                      </Typography>
                      <Typography size="xs" variant="muted">
                        {row.productLineCount} dòng
                      </Typography>
                      {row.invoiceNumber ? (
                        <Typography
                          as="span"
                          size="xs"
                          layoutClassName="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800"
                          textClassName="font-mono text-[10px] text-slate-700 dark:text-slate-200"
                        >
                          {row.invoiceNumber}
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
    </Box>
  );
};

export default BillImportReceiptListTab;
