import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

import Button from '@/components/ui/Button';
export interface BillImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Tiêu đề modal, mặc định "Nhập bill mới". */
  title?: string;
  children: React.ReactNode;
}

/**
 * Modal wrapper cho luồng nhập bill — render nội dung (BillImportEntryTab)
 * trong portal, có backdrop, scroll dọc, nút X cố định.
 */
const BillImportModal: React.FC<BillImportModalProps> = ({
  open,
  onClose,
  title = 'Nhập bill mới',
  children,
}) => {
  // Đóng bằng Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Khoá scroll body khi mở
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const tree = (
    <Box
      layoutClassName="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      backgroundClassName="bg-slate-900/60"
    >
      <Card
        padding="none"
        borderClassName="border-slate-200 dark:border-slate-700"
        layoutClassName="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden"
      >
        {/* Header cố định (không cuộn) — nền đặc, không lòi nội dung phía sau */}
        <Box
          layoutClassName="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Typography size="sm" layoutClassName="font-semibold">
            {title}
          </Typography>
          <Button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center"
            roundedClassName="rounded-full"
            borderClassName="border border-slate-300 dark:border-slate-600"
            backgroundClassName="bg-slate-100 dark:bg-slate-800"
            textClassName="text-slate-700 dark:text-slate-200"
            hoverClassName="hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
           variant="ghost" disableVariantHover disableVariantTextColor>
            <X className="h-5 w-5" />
          </Button>
        </Box>

        {/* Body cuộn bên trong */}
        <Box layoutClassName="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">{children}</Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

export default BillImportModal;
