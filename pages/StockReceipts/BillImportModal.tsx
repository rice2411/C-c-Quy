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
      layoutClassName="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:p-6"
      backgroundClassName="bg-slate-900/60"
    >
      <Card
        padding="none"
        borderClassName="border-slate-200 dark:border-slate-700"
        layoutClassName="w-full max-w-5xl my-4"
      >
        {/* Sticky header */}
        <Box
          layoutClassName="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-3"
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
            layoutClassName="flex h-9 w-9 items-center justify-center"
            roundedClassName="rounded-full"
            textClassName="text-slate-500 dark:text-slate-300"
            hoverClassName="hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-5 w-5" />
          </Button>
        </Box>

        {/* Body */}
        <Box layoutClassName="space-y-4 p-4 sm:p-5">{children}</Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

export default BillImportModal;
