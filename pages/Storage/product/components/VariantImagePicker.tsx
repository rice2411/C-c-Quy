/**
 * VariantImagePicker — chọn 1 ảnh cho biến thể (vị/size) từ gallery sản phẩm.
 * Dùng chung cho FlavorVariantEditor + SizeEditor.
 */
import React from 'react';
import { ImageOff } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

interface VariantImagePickerProps {
  images: string[];
  value?: string;
  onChange: (image: string | undefined) => void;
}

const VariantImagePicker: React.FC<VariantImagePickerProps> = ({ images, value, onChange }) => {
  if (images.length === 0) {
    return <Typography size="xs" variant="muted">Upload ảnh ở phần trên để gán cho biến thể.</Typography>;
  }
  return (
    <Box layoutClassName="flex flex-wrap items-center gap-1.5">
      {/* Không dùng ảnh */}
      <Button
        type="button"
        onClick={() => onChange(undefined)}
        aria-label="Không dùng ảnh"
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        sizeClassName="p-0"
        roundedClassName="rounded-lg"
        layoutClassName="flex h-11 w-11 items-center justify-center"
        borderClassName={!value ? 'border-2 border-primary-500' : 'border border-dashed border-slate-300 dark:border-slate-600'}
        textClassName="text-slate-400"
        hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
        <ImageOff className="h-4 w-4" />
      </Button>
      {images.map((img) => {
        const active = value === img;
        return (
          <Button
            key={img}
            type="button"
            onClick={() => onChange(img)}
            aria-label="Chọn ảnh"
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            sizeClassName="p-0"
            roundedClassName="rounded-lg"
            layoutClassName="h-11 w-11 overflow-hidden"
            borderClassName={active ? 'border-2 border-primary-500' : 'border border-slate-200 dark:border-slate-600'}>
            <Image src={img} alt="" layoutClassName="h-full w-full object-cover" />
          </Button>
        );
      })}
    </Box>
  );
};

export default VariantImagePicker;
