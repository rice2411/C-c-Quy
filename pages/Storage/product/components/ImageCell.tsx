/**
 * ImageCell — ô ảnh cho 1 dòng biến thể (vị/size): hiện thumbnail hiện tại,
 * bấm mở popover chọn ảnh từ gallery sản phẩm (hoặc bỏ ảnh).
 *
 * Popover render qua PORTAL (document.body) + position:fixed tính từ nút → KHÔNG bị
 * `overflow-hidden` của bảng/modal cắt hay bị phần tử khác đè (trước đây bị đè).
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const PANEL_W = 224; // w-56
const PANEL_MAX_H = 260;

const ImageCell: React.FC<ImageCellProps> = ({ images, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Tính vị trí popover từ rect của nút; kẹp trong viewport, thiếu chỗ dưới thì mở lên.
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = r.left;
    if (left + PANEL_W > window.innerWidth - 8) left = window.innerWidth - PANEL_W - 8;
    if (left < 8) left = 8;
    let top = r.bottom + 4;
    if (top + PANEL_MAX_H > window.innerHeight && r.top - PANEL_MAX_H > 0) top = r.top - PANEL_MAX_H - 4;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const reflow = () => place();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', reflow, true);
    };
  }, [open, place]);

  const panel = open && pos
    ? createPortal(
        <Box
          ref={panelRef as React.RefObject<HTMLDivElement>}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_W, maxHeight: PANEL_MAX_H }}
          layoutClassName="z-[120] overflow-y-auto rounded-xl border p-2 shadow-lg"
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
        </Box>,
        document.body,
      )
    : null;

  return (
    <Box layoutClassName="relative inline-block" ref={triggerRef as React.RefObject<HTMLDivElement>}>
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
      {panel}
    </Box>
  );
};

export default ImageCell;
