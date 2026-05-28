import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, X } from 'lucide-react';
import type { SavedStockReceiptDetail } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';

import Button from '@/components/ui/Button';
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
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  open,
  detailLoading,
  receiptDetail,
  onClose,
}) => {
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
          <Button
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
            onClick={onClose}
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            Đóng
          </Button>
        </Box>

        {detailLoading ? (
          <Typography size="sm" variant="muted">
            Đang tải chi tiết...
          </Typography>
        ) : !receiptDetail ? (
          <Typography size="sm" variant="muted">
            Không tìm thấy dữ liệu bill.
          </Typography>
        ) : (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <Typography size="sm">
                <strong>Tên nhà cung cấp:</strong> {receiptDetail.supplierNameRaw || '—'}
              </Typography>
              <Typography size="sm" layoutClassName="mt-1">
                <strong>Ngày giờ:</strong> {receiptDetail.receiptDate || '—'}
              </Typography>
            </Box>

            {receiptDetail.receiptImageBase64 && imageSrc ? (
              <Button
                type="button"
                className="group w-full overflow-hidden rounded-lg border border-slate-200 text-left transition ring-offset-2 hover:ring-2 hover:ring-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openImageViewer();
                }}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <img
                  src={imageSrc}
                  alt="Bill"
                  className="max-h-80 w-full object-contain bg-slate-50 dark:bg-slate-900"
                />
                <Typography size="xs" variant="muted" layoutClassName="bg-slate-100 px-2 py-1.5 text-center dark:bg-slate-800">
                  Bấm để xem phóng to và zoom
                </Typography>
              </Button>
            ) : null}

            <Box layoutClassName="rounded-lg border border-slate-200 dark:border-slate-700">
              <Box layoutClassName="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <Typography size="sm" layoutClassName="font-semibold">
                  Sản phẩm
                </Typography>
              </Box>
              <Box layoutClassName="space-y-2 p-3">
                {receiptDetail.lineItems.length === 0 ? (
                  <Typography size="sm" variant="muted">
                    Không có dòng sản phẩm.
                  </Typography>
                ) : (
                  receiptDetail.lineItems.map((item, idx) => (
                    <Box
                      key={`${item.name}-${idx}`}
                      layoutClassName="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800"
                    >
                      <Typography size="sm">{item.name || `Sản phẩm ${idx + 1}`}</Typography>
                      <Typography size="sm" layoutClassName="font-semibold">
                        {formatVNDOrDash(item.lineTotal)}
                      </Typography>
                    </Box>
                  ))
                )}
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
            className="fixed right-3 z-[210] flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-2 ring-white/40 backdrop-blur-sm hover:bg-white/30 active:bg-white/40"
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
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40"
                aria-label="Thu nhỏ"
                disabled={imageZoom <= ZOOM_MIN}
                onClick={() => setImageZoom((z) => clampZoom(z - ZOOM_STEP))}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Minus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setImageZoom(1)}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                100%
              </Button>
              <Button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-40"
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
              <img
                src={imageSrc}
                alt="Bill phóng to"
                draggable={false}
                className="max-h-none select-none"
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
