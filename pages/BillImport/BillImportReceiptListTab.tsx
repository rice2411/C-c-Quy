import React, { useRef } from 'react';
import { Camera, FileText, RotateCw, Upload } from 'lucide-react';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import FilterToolbar from '@/components/shared/FilterToolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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
}

const BillImportReceiptListTab: React.FC<BillImportReceiptListTabProps> = ({
  receiptSearch,
  onReceiptSearchChange,
  receiptLoading,
  onRefresh,
  filteredReceipts,
  onRowClick,
  onFileSelected,
}) => {
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
            className="hidden"
            onChange={handleChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
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
                Chụp ảnh hoặc tải ảnh hoá đơn — hệ thống tự đọc OCR và chuẩn hoá thành phiếu nhập.
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
          searchPlaceholder="Tìm theo NCC, ngày bill, ngày nhập, mã phiếu..."
        />
        <Box layoutClassName="max-h-[560px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
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
                </Box>
              ) : null}
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Mã HĐ</TableHeaderCell>
                  <TableHeaderCell>Ngày bill</TableHeaderCell>
                  <TableHeaderCell>Ngày nhập</TableHeaderCell>
                  <TableHeaderCell>Nhà cung cấp</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceipts.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    onClick={() => void onRowClick(row.id)}
                  >
                    <TableCell>
                      {row.invoiceNumber ? (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {row.invoiceNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{row.receiptDate || '—'}</TableCell>
                    <TableCell>{formatImportedAt(row.createdAt)}</TableCell>
                    <TableCell>{row.supplierNameRaw || '—'}</TableCell>
                    <TableCell>{formatVNDOrDash(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default BillImportReceiptListTab;
