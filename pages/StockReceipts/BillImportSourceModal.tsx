import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, ImagePlus, PencilLine, Upload } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import BillImportModal from '@/pages/StockReceipts/BillImportModal';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BillImportSourceModalProps {
  open: boolean;
  onClose: () => void;
  /** Ảnh bill được chọn (kéo-thả / dán / tải lên / chụp) → chạy OCR. */
  onImageSelected: (file: File) => void;
  /** Mở form nhập phiếu THỦ CÔNG (không OCR). */
  onStartManual: () => void;
}

/**
 * Modal chọn nguồn nhập phiếu: 1 dropzone (kéo-thả + dán Ctrl/⌘+V + bấm chọn),
 * kèm 3 lựa chọn nhanh — chụp ảnh (camera), tải ảnh lên, nhập thủ công.
 * Ảnh hợp lệ → onImageSelected (chạy OCR); nhập tay → onStartManual.
 */
const BillImportSourceModal: React.FC<BillImportSourceModalProps> = ({
  open,
  onClose,
  onImageSelected,
  onStartManual,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Nhận 1 file ảnh từ mọi nguồn → validate rồi bắn ra ngoài.
  const acceptImage = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error(t('billImport.invalidFile'));
        return;
      }
      onImageSelected(file);
    },
    [onImageSelected, t],
  );

  // Dán ảnh (Ctrl/⌘+V) khi modal đang mở. Clipboard không có ảnh → bỏ qua.
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItem = Array.from(items).find(
        (it) => it.kind === 'file' && it.type.startsWith('image/'),
      );
      const file = imageItem?.getAsFile();
      if (!file) return;
      e.preventDefault();
      acceptImage(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, acceptImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    acceptImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    acceptImage(e.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  return (
    <BillImportModal open={open} onClose={onClose} title="Nhập phiếu nhập">
      <Box layoutClassName="mx-auto w-full max-w-lg space-y-4">
        {/* File input thô: chưa có UI component cho input file (giống BillImportEntryTab). */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {/* ===== DROPZONE: kéo-thả / dán / bấm chọn ===== */}
        <Box
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          layoutClassName="flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-10 text-center"
          borderClassName={
            dragActive
              ? 'border-2 border-dashed border-primary-500'
              : 'border-2 border-dashed border-slate-300 dark:border-slate-600'
          }
          backgroundClassName={
            dragActive
              ? 'bg-primary-50 dark:bg-primary-950/30'
              : 'bg-slate-50 dark:bg-slate-900/40'
          }
          roundedClassName="rounded-2xl"
          stateClassName="transition-colors"
        >
          <Box
            layoutClassName="flex h-12 w-12 items-center justify-center"
            roundedClassName="rounded-full"
            backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
          >
            <ImagePlus className="h-6 w-6 text-primary-600 dark:text-primary-300" />
          </Box>
          <Typography size="sm" layoutClassName="font-medium">
            {t('billImport.dropzoneTitle')}
          </Typography>
          <Typography size="xs" variant="muted">
            {t('billImport.dropzoneHint')}
          </Typography>
        </Box>

        {/* ===== 3 lựa chọn nhanh ===== */}
        <Box layoutClassName="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            onClick={openCamera}
            leftIcon={<Camera />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-3 py-2 text-xs"
            backgroundClassName="bg-primary-600 hover:bg-primary-700"
            textClassName="font-medium text-white"
            borderClassName="border border-transparent"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center justify-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            {t('billImport.optCamera')}
          </Button>
          <Button
            type="button"
            onClick={openFilePicker}
            leftIcon={<Upload />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-3 py-2 text-xs"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-600"
            textClassName="font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center justify-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            {t('billImport.optUpload')}
          </Button>
          <Button
            type="button"
            onClick={onStartManual}
            leftIcon={<PencilLine />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-3 py-2 text-xs"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-600"
            textClassName="font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center justify-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            {t('billImport.optManual')}
          </Button>
        </Box>
      </Box>
    </BillImportModal>
  );
};

export default BillImportSourceModal;
