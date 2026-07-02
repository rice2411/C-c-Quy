/**
 * ImageCell — ô ảnh cho 1 dòng biến thể (vị/size): hiện thumbnail hiện tại,
 * bấm mở popover chọn ảnh từ gallery sản phẩm (hoặc bỏ ảnh).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, ImageOff } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

interface ImageCellProps {
  images: string[];
  value?: string;
  onChange: (image: string | undefined) => void;
}

const ImageCell: React.FC<ImageCellProps> = ({ images, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <Box layoutClassName="relative" ref={ref as React.RefObject<HTMLDivElement>}>
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chọn ảnh"
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        sizeClassName="p-0"
        roundedClassName="rounded-lg"
        layoutClassName="flex h-11 w-11 items-center justify-center overflow-hidden"
        borderClassName={value ? 'border border-slate-200 dark:border-slate-600' : 'border border-dashed border-slate-300 dark:border-slate-600'}
        backgroundClassName="bg-slate-50 dark:bg-slate-800"
        textClassName="text-slate-400">
        {value ? <Image src={value} alt="" layoutClassName="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4" />}
      </Button>

      {open ? (
        <Box
          layoutClassName="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border p-2 shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800">
          {images.length === 0 ? (
            <Typography size="xs" variant="muted" layoutClassName="p-2">Chưa có ảnh trong thư viện. Upload ở phần trên.</Typography>
          ) : (
            <Box layoutClassName="grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false); }}
                aria-label="Bỏ ảnh"
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="p-0"
                roundedClassName="rounded-md"
                layoutClassName="flex h-12 w-full items-center justify-center"
                borderClassName={!value ? 'border-2 border-primary-500' : 'border border-dashed border-slate-300 dark:border-slate-600'}
                textClassName="text-slate-400">
                <ImageOff className="h-4 w-4" />
              </Button>
              {images.map((img) => {
                const active = value === img;
                return (
                  <Button
                    key={img}
                    type="button"
                    onClick={() => { onChange(img); setOpen(false); }}
                    aria-label="Chọn ảnh này"
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    sizeClassName="p-0"
                    roundedClassName="rounded-md"
                    layoutClassName="h-12 w-full overflow-hidden"
                    borderClassName={active ? 'border-2 border-primary-500' : 'border border-slate-200 dark:border-slate-600'}>
                    <Image src={img} alt="" layoutClassName="h-full w-full object-cover" />
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
};

export default ImageCell;
