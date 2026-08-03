import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Minus, Package, Pencil, Plus, X } from 'lucide-react';
import type { SavedStockReceiptDetail } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';

import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

function clampZoom(n: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n));
}

export interface ReceiptDetailModalProps {
  open: boolean;
  detailLoading: boolean;
  receiptDetail: SavedStockReceiptDetail | null;
  onClose: () => void;
  /** Bấm "Sửa" → mở form nhập với dữ liệu phiếu này (prefill). */
  onEdit?: () => void;
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  open,
  detailLoading,
  receiptDetail,
  onClose,
  onEdit,
}) => {
  const { t } = useLanguage();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  const imageSrc =
    receiptDetail?.receiptImageBase64 &&
    `data:${receiptDetail.receiptImageMimeType || 'image/jpeg'};base64,${receiptDetail.receiptImageBase64}`;

  const openImageViewer = useCallback(() => {
    setImageZoom(1);
    setImageViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setImageViewerOpen(false);
      setImageZoom(1);
    }
  }, [open]);

  useEffect(() => {
    if (!imageViewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imageViewerOpen, closeImageViewer]);

  if (!open) return null;

  // Portal ra body: fixed trong <main> bị nằm dưới header/sidebar (stacking context) nên nút X lightbox bị che
  const modalTree = (
    <Box
      layoutClassName="fixed inset-0 z-[100] flex items-center justify-center p-4"
      backgroundClassName="bg-slate-900/60"
      onClick={onClose}
    >
      <Card
        padding="md"
        borderClassName="border-slate-200 dark:border-slate-700"
        layoutClassName="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Box layoutClassName="flex items-center justify-between gap-2">
          <Typography size="sm" layoutClassName="font-semibold">
            Chi tiết bill
          </Typography>
          <Box layoutClassName="flex items-center gap-2">
            {onEdit && receiptDetail && !receiptDetail.reconciled ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                onClick={onEdit}
              >
                Sửa
              </Button>
            ) : null}
            <Button
              type="button"
              sizeClassName="text-sm"
              textClassName="font-medium text-slate-500 dark:text-slate-300"
              hoverClassName="hover:text-slate-700 dark:hover:text-white"
              onClick={onClose}
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
              Đóng
            </Button>
          </Box>
        </Box>

        {detailLoading ? (
          <Typography size="sm" variant="muted">
            Đang tải chi tiết...
          </Typography>
        ) : !receiptDetail ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Không tìm thấy dữ liệu bill."
          />
        ) : (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <Typography size="sm">
                <Typography as="span" textClassName="font-semibold">Tên nhà cung cấp:</Typography>{' '}
                {receiptDetail.supplierNameRaw || '—'}
              </Typography>
              <Typography size="sm" layoutClassName="mt-1">
                <Typography as="span" textClassName="font-semibold">Ngày giờ:</Typography>{' '}
                {receiptDetail.receiptDate || '—'}
              </Typography>
              <Typography size="sm" layoutClassName="mt-1">
                <Typography as="span" textClassName="font-semibold">{t('billImport.colInvoice')}:</Typography>{' '}
                {receiptDetail.invoiceNumber ? (
                  <Typography as="span" size="sm" textClassName="font-mono text-slate-600 dark:text-slate-300">
                    {receiptDetail.invoiceNumber}
                  </Typography>
                ) : (
                  '—'
                )}
              </Typography>
            </Box>

            {receiptDetail.receiptImageBase64 && imageSrc ? (
              <Button
                type="button"
                layoutClassName="group w-full overflow-hidden text-left transition"
                roundedClassName="rounded-lg"
                focusClassName="ring-offset-2 hover:ring-2 hover:ring-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={(e) => {
                  e.stopPropagation();
                  openImageViewer();
                }}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border border-slate-200 dark:border-slate-700">
                <Image
                  src={imageSrc}
                  alt="Bill"
                  layoutClassName="max-h-80 w-full object-contain bg-slate-50 dark:bg-slate-900"
                />
                <Typography size="xs" variant="muted" layoutClassName="bg-slate-100 px-2 py-1.5 text-center dark:bg-slate-800">
                  Bấm để xem phóng to và zoom
                </Typography>
              </Button>
            ) : (
              <Box
                layoutClassName="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 dark:border-slate-600"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <Typography size="sm" variant="muted">
                  {t('billImport.manualNoImage')}
                </Typography>
              </Box>
            )}

            <Box layoutClassName="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <Box layoutClassName="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <Typography size="sm" layoutClassName="font-semibold">
                  {t('billImport.items')}
                </Typography>
              </Box>
              {receiptDetail.lineItems.length === 0 ? (
                <Box layoutClassName="p-3">
                  <EmptyState icon={<Package className="h-6 w-6" />} title={t('billImport.emptyLines')} />
                </Box>
              ) : (
                <Box layoutClassName="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell layoutClassName="px-3 py-2">{t('billImport.colName')}</TableHeaderCell>
                        <TableHeaderCell layoutClassName="px-3 py-2 text-right">
                          {t('billImport.colQty')}
                        </TableHeaderCell>
                        <TableHeaderCell layoutClassName="px-3 py-2">{t('billImport.colUnit')}</TableHeaderCell>
                        <TableHeaderCell layoutClassName="px-3 py-2 text-right">
                          {t('billImport.colPrice')}
                        </TableHeaderCell>
                        <TableHeaderCell layoutClassName="px-3 py-2 text-right">
                          {t('billImport.colLineTotal')}
                        </TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receiptDetail.lineItems.map((item, idx) => (
                        <TableRow key={`${item.name}-${idx}`}>
                          <TableCell layoutClassName="px-3 py-2">
                            <Typography size="sm">{item.name || `Sản phẩm ${idx + 1}`}</Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2 text-right">
                            <Typography size="sm" layoutClassName="tabular-nums">
                              {item.quantity ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2">
                            <Typography size="sm" variant="muted">
                              {item.unit || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2 text-right">
                            <Typography size="sm" layoutClassName="tabular-nums">
                              {formatVNDOrDash(item.unitPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2 text-right">
                            <Typography size="sm" layoutClassName="font-semibold tabular-nums">
                              {formatVNDOrDash(item.lineTotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              {/* Breakdown: chỉ hiện dòng có giá trị */}
              {[
                { label: 'Tạm tính', val: receiptDetail.subtotal, neg: false },
                { label: 'Thuế', val: receiptDetail.tax, neg: false },
                { label: 'Phí vận chuyển', val: receiptDetail.shippingFee, neg: false },
                { label: 'Giảm giá', val: receiptDetail.discount, neg: true },
              ]
                .filter((r) => typeof r.val === 'number' && r.val !== 0)
                .map((r) => (
                  <Box key={r.label} layoutClassName="flex items-center justify-between px-3 py-1">
                    <Typography size="sm" variant="muted">{r.label}</Typography>
                    <Typography size="sm" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">
                      {r.neg ? '−' : ''}{formatVNDOrDash(Math.abs(r.val as number))}
                    </Typography>
                  </Box>
                ))}
              <Box
                layoutClassName="flex items-center justify-between border-t border-slate-200 px-3 py-2.5 dark:border-slate-700"
                backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
              >
                <Typography size="sm" layoutClassName="font-semibold">
                  {t('billImport.total')}
                </Typography>
                <Typography size="sm" layoutClassName="font-bold tabular-nums text-primary-700 dark:text-primary-300">
                  {formatVNDOrDash(receiptDetail.totalAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      {imageViewerOpen && imageSrc ? (
        <Box
          layoutClassName="fixed inset-0 z-[200] flex flex-col bg-black/95"
          onClick={closeImageViewer}
        >
          {/* Nút X cố định sau khi mở ảnh — trên mọi thanh app (z cao, portaled) */}
          <Button
            type="button"
            layoutClassName="fixed right-3 z-[210] flex h-12 w-12 items-center justify-center backdrop-blur-sm"
            roundedClassName="rounded-full"
            backgroundClassName="bg-white/20"
            textClassName="text-white"
            shadowClassName="shadow-lg ring-2 ring-white/40"
            hoverClassName="hover:bg-white/30 active:bg-white/40"
            style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
            aria-label="Đóng xem ảnh"
            onClick={(e) => {
              e.stopPropagation();
              closeImageViewer();
            }}
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-7 w-7" strokeWidth={2.5} />
          </Button>

          <Box
            layoutClassName="flex shrink-0 items-center justify-center gap-3 border-b border-white/10 px-12 py-2 text-white sm:px-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Typography size="sm" textClassName="tabular-nums text-white">
              {Math.round(imageZoom * 100)}%
            </Typography>
            <Box layoutClassName="flex items-center gap-1">
              <Button
                type="button"
                layoutClassName="flex min-h-11 min-w-11 items-center justify-center"
                roundedClassName="rounded-lg"
                hoverClassName="hover:bg-white/10"
                stateClassName="disabled:opacity-40"
                aria-label="Thu nhỏ"
                disabled={imageZoom <= ZOOM_MIN}
                onClick={() => setImageZoom((z) => clampZoom(z - ZOOM_STEP))}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Minus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                roundedClassName="rounded-lg"
                sizeClassName="px-3 py-2 text-sm"
                hoverClassName="hover:bg-white/10"
                onClick={() => setImageZoom(1)}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                100%
              </Button>
              <Button
                type="button"
                layoutClassName="flex min-h-11 min-w-11 items-center justify-center"
                roundedClassName="rounded-lg"
                hoverClassName="hover:bg-white/10"
                stateClassName="disabled:opacity-40"
                aria-label="Phóng to"
                disabled={imageZoom >= ZOOM_MAX}
                onClick={() => setImageZoom((z) => clampZoom(z + ZOOM_STEP))}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Plus className="h-5 w-5" />
              </Button>
            </Box>
          </Box>

          <Box
            layoutClassName="min-h-0 flex-1 overflow-auto overscroll-contain"
            onWheel={(e) => {
              if (!e.ctrlKey && !e.metaKey) return;
              e.preventDefault();
              setImageZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
            }}
          >
            <Box
              layoutClassName="flex min-h-full w-full items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={imageSrc}
                alt="Bill phóng to"
                draggable={false}
                layoutClassName="max-h-none select-none"
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.12s ease-out',
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP * 0.5 : -ZOOM_STEP * 0.5)));
                }}
              />
            </Box>
          </Box>

          <Box
            layoutClassName="shrink-0 border-t border-white/10 px-3 py-2 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Typography size="xs" textClassName="text-white/60">
              Góc phải: nút X để thoát · Lăn trên ảnh để zoom · Cuộn khi ảnh lớn
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Box>
  );

  return createPortal(modalTree, document.body);
};

export default ReceiptDetailModal;
