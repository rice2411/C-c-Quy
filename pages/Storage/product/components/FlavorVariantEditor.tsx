/**
 * FlavorVariantEditor — khai báo vị NGAY TRONG sản phẩm (không dùng config chung).
 * Mỗi vị: tên + màu + giá riêng (tùy chọn) + ảnh riêng (từ gallery). Giá dòng = tổng vị chọn.
 */
import React, { useState } from 'react';
import { IceCream, Plus, Trash2 } from 'lucide-react';
import type { ProductFlavorVariant } from '@/types';
import { DEFAULT_FLAVOR_COLORS } from '@/types/flavor';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import VariantImagePicker from '@/pages/Storage/product/components/VariantImagePicker';

interface FlavorVariantEditorProps {
  variants: ProductFlavorVariant[];
  onChange: (variants: ProductFlavorVariant[]) => void;
  galleryImages: string[];
}

const FlavorVariantEditor: React.FC<FlavorVariantEditorProps> = ({ variants, onChange, galleryImages }) => {
  const [name, setName] = useState('');

  const add = () => {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return;
    if (variants.some((v) => v.name.toLowerCase() === n.toLowerCase())) { setName(''); return; }
    const color = DEFAULT_FLAVOR_COLORS[variants.length % DEFAULT_FLAVOR_COLORS.length];
    onChange([...variants, { name: n, color }]);
    setName('');
  };
  const patch = (idx: number, p: Partial<ProductFlavorVariant>) =>
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...p } : v)));
  const remove = (idx: number) => onChange(variants.filter((_, i) => i !== idx));

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center gap-2">
        <Box layoutClassName="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
          <IceCream className="h-4 w-4 text-primary-500" />
        </Box>
        <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">Vị</Typography>
        <Typography as="span" size="xs" variant="muted" layoutClassName="ml-auto">{variants.length} vị · giá dòng = tổng vị chọn</Typography>
      </Box>

      {variants.map((v, idx) => (
        <Box
          key={idx}
          layoutClassName="flex flex-col gap-3 rounded-xl p-3"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50/70 dark:bg-slate-900/30">
          <Box layoutClassName="flex items-center gap-3">
            {/* Preview ảnh vị */}
            <Box
              layoutClassName="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              style={{ boxShadow: `inset 0 0 0 2px ${v.color || '#64748b'}22` }}>
              {v.image ? (
                <Image src={v.image} alt={v.name} layoutClassName="h-full w-full object-cover" />
              ) : (
                <Box layoutClassName="h-4 w-4 rounded-full" style={{ backgroundColor: v.color || '#64748b' }} />
              )}
            </Box>
            {/* Tên + giá */}
            <Box layoutClassName="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={v.name}
                onChange={(e) => patch(idx, { name: e.target.value })}
                placeholder="Tên vị"
                backgroundClassName="bg-white dark:bg-slate-700"
                containerClassName="min-w-0 flex-1" />
              <Input
                type="number"
                min={0}
                step={1000}
                value={v.price ?? 0}
                onChange={(e) => patch(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                rightIcon={<Typography as="span" size="xs" variant="muted">đ</Typography>}
                backgroundClassName="bg-white dark:bg-slate-700"
                containerClassName="w-full shrink-0 sm:w-32" />
            </Box>
            <Button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Xoá vị ${v.name}`}
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

          {/* Màu */}
          <Box layoutClassName="flex flex-wrap items-center gap-1.5">
            <Typography as="span" size="xs" variant="muted" layoutClassName="w-10 shrink-0">Màu</Typography>
            {DEFAULT_FLAVOR_COLORS.map((c) => (
              <Button
                key={c}
                type="button"
                onClick={() => patch(idx, { color: c })}
                aria-label={`Màu ${c}`}
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                layoutClassName="h-5 w-5"
                roundedClassName="rounded-full"
                borderClassName={v.color === c ? 'border-2 border-slate-700 dark:border-white' : 'border border-transparent'}
                style={{ backgroundColor: c }}>
                {' '}
              </Button>
            ))}
            <Input
              type="color"
              value={v.color || '#64748b'}
              onChange={(e) => patch(idx, { color: e.target.value })}
              aria-label="Màu tùy chọn"
              containerClassName="w-8 shrink-0"
              sizeClassName="h-6 p-0.5"
              backgroundClassName="bg-white dark:bg-slate-700" />
          </Box>

          {/* Ảnh */}
          <Box layoutClassName="flex flex-wrap items-start gap-1.5">
            <Typography as="span" size="xs" variant="muted" layoutClassName="mt-3 w-10 shrink-0">Ảnh</Typography>
            <Box layoutClassName="min-w-0 flex-1">
              <VariantImagePicker images={galleryImages} value={v.image} onChange={(img) => patch(idx, { image: img })} />
            </Box>
          </Box>
        </Box>
      ))}

      {variants.length === 0 ? (
        <Typography size="xs" variant="muted">Chưa có vị. Thêm ở dưới.</Typography>
      ) : null}

      {/* Thêm vị */}
      <Box layoutClassName="flex items-center gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Tên vị mới (vd: Matcha)"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          containerClassName="flex-1" />
        <Button
          type="button"
          onClick={add}
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          sizeClassName="px-3 py-2 text-sm"
          roundedClassName="rounded-lg">
          Thêm vị
        </Button>
      </Box>
    </Card>
  );
};

export default FlavorVariantEditor;
