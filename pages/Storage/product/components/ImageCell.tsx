/**
 * ImageCell — ô ảnh cho 1 dòng biến thể (vị/size): hiện thumbnail hiện tại,
 * bấm mở popover chọn ảnh từ gallery sản phẩm (hoặc bỏ ảnh).
 * Popover neo + portal dùng component chung `components/ui/Popover`.
 */
import React from 'react';
import { ImagePlus, ImageOff } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import Popover from '@/components/ui/Popover';

interface ImageCellProps {
  images: string[];
  value?: string;
  onChange: (image: string | undefined) => void;
}

const ImageCell: React.FC<ImageCellProps> = ({ images, value, onChange }) => (
  <Popover
    width={224}
    trigger={
      <Button
        type="button"
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
    }>
    {(close) =>
      images.length === 0 ? (
        <Typography size="xs" variant="muted" layoutClassName="p-2">Chưa có ảnh trong thư viện. Upload ở phần trên.</Typography>
      ) : (
        <Box layoutClassName="grid grid-cols-4 gap-1.5">
          <Button
            type="button"
            onClick={() => { onChange(undefined); close(); }}
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
                onClick={() => { onChange(img); close(); }}
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
      )
    }
  </Popover>
);

export default ImageCell;
