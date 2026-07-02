/**
 * SizeEditor — khai báo size (biến thể giá) của sản phẩm: mỗi size = tên + giá + ảnh riêng (tùy chọn).
 * Khi sản phẩm có size, giá bán dòng đơn lấy theo size chọn (giá gốc bỏ qua).
 */
import React, { useState } from 'react';
import { Ruler, Plus, Trash2 } from 'lucide-react';
import type { ProductSize } from '@/types';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import VariantImagePicker from '@/pages/Storage/product/components/VariantImagePicker';

interface SizeEditorProps {
  sizes: ProductSize[];
  onChange: (sizes: ProductSize[]) => void;
  galleryImages: string[];
}

const SizeEditor: React.FC<SizeEditorProps> = ({ sizes, onChange, galleryImages }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);

  const add = () => {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return;
    if (sizes.some((s) => s.name.toLowerCase() === n.toLowerCase())) { setName(''); return; }
    onChange([...sizes, { name: n, price: Math.max(0, Number(price) || 0) }]);
    setName('');
    setPrice(0);
  };
  const patch = (idx: number, p: Partial<ProductSize>) =>
    onChange(sizes.map((s, i) => (i === idx ? { ...s, ...p } : s)));
  const remove = (idx: number) => onChange(sizes.filter((_, i) => i !== idx));

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center gap-2">
        <Box layoutClassName="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
          <Ruler className="h-4 w-4 text-primary-500" />
        </Box>
        <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">Size</Typography>
        <Typography as="span" size="xs" variant="muted" layoutClassName="ml-auto">{sizes.length} size · giá dòng theo size chọn</Typography>
      </Box>

      {sizes.map((s, idx) => (
        <Box
          key={idx}
          layoutClassName="flex flex-col gap-3 rounded-xl p-3"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50/70 dark:bg-slate-900/30">
          <Box layoutClassName="flex items-center gap-3">
            <Box
              layoutClassName="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800">
              {s.image ? (
                <Image src={s.image} alt={s.name} layoutClassName="h-full w-full object-cover" />
              ) : (
                <Ruler className="h-4 w-4 text-slate-300 dark:text-slate-600" />
              )}
            </Box>
            <Box layoutClassName="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={s.name}
                onChange={(e) => patch(idx, { name: e.target.value })}
                placeholder="Tên size (vd: Combo Gia Đình 5 cái)"
                backgroundClassName="bg-white dark:bg-slate-700"
                containerClassName="min-w-0 flex-1" />
              <Input
                type="number"
                min={0}
                step={1000}
                value={s.price}
                onChange={(e) => patch(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                rightIcon={<Typography as="span" size="xs" variant="muted">đ</Typography>}
                backgroundClassName="bg-white dark:bg-slate-700"
                containerClassName="w-full shrink-0 sm:w-32" />
            </Box>
            <Button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Xoá size ${s.name}`}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              sizeClassName="p-1.5"
              roundedClassName="rounded-lg"
              borderClassName="border border-transparent"
              textClassName="text-slate-400"
              hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Box>
          <Box layoutClassName="flex flex-wrap items-start gap-1.5">
            <Typography as="span" size="xs" variant="muted" layoutClassName="mt-3 w-10 shrink-0">Ảnh</Typography>
            <Box layoutClassName="min-w-0 flex-1">
              <VariantImagePicker images={galleryImages} value={s.image} onChange={(img) => patch(idx, { image: img })} />
            </Box>
          </Box>
        </Box>
      ))}

      {sizes.length === 0 ? (
        <Typography size="xs" variant="muted">Chưa có size. Để trống nếu sản phẩm bán 1 giá.</Typography>
      ) : null}

      {/* Thêm size */}
      <Box layoutClassName="flex items-center gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Tên size mới"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          containerClassName="flex-1" />
        <Input
          type="number"
          min={0}
          step={1000}
          value={price}
          onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
          rightIcon={<Typography as="span" size="xs" variant="muted">đ</Typography>}
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          containerClassName="w-32 shrink-0" />
        <Button
          type="button"
          onClick={add}
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          sizeClassName="px-3 py-2 text-sm"
          roundedClassName="rounded-lg">
          Thêm size
        </Button>
      </Box>
    </Card>
  );
};

export default SizeEditor;
