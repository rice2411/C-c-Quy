/**
 * FlavorVariantEditor — khai báo vị NGAY TRONG sản phẩm (không dùng danh sách config chung).
 * Mỗi vị: tên + màu + giá riêng (tùy chọn) + ảnh riêng (chọn từ gallery sản phẩm).
 * Giá dòng đơn = tổng giá các vị chọn (nếu vị có đặt giá).
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
      <Box layoutClassName="flex items-center justify-between">
        <Box layoutClassName="flex items-center gap-2">
          <IceCream className="h-4 w-4 text-primary-500" />
          <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">
            Vị (ảnh + giá riêng)
          </Typography>
        </Box>
        <Typography as="span" size="xs" variant="muted">{variants.length} vị</Typography>
      </Box>

      {/* Danh sách vị đã khai báo */}
      {variants.length > 0 ? (
        <Box layoutClassName="flex flex-col gap-2">
          {variants.map((v, idx) => (
            <Box
              key={idx}
              layoutClassName="flex flex-col gap-2 rounded-lg p-2"
              borderClassName="border border-slate-100 dark:border-slate-700"
              backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
              <Box layoutClassName="flex items-center gap-2">
                <Box layoutClassName="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: v.color || '#64748b' }} />
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
                  placeholder="Giá"
                  backgroundClassName="bg-white dark:bg-slate-700"
                  containerClassName="w-24 shrink-0" />
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

              {/* Màu vị */}
              <Box layoutClassName="flex flex-wrap items-center gap-1.5">
                <Typography as="span" size="xs" variant="muted" layoutClassName="mr-0.5">Màu:</Typography>
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

              {/* Ảnh vị (chọn từ gallery) */}
              {galleryImages.length > 0 ? (
                <Box layoutClassName="flex flex-wrap items-center gap-1.5">
                  <Typography as="span" size="xs" variant="muted" layoutClassName="mr-0.5">Ảnh:</Typography>
                  {galleryImages.map((img) => {
                    const active = v.image === img;
                    return (
                      <Button
                        key={img}
                        type="button"
                        onClick={() => patch(idx, { image: active ? undefined : img })}
                        aria-label="Chọn ảnh cho vị"
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        sizeClassName="p-0"
                        roundedClassName="rounded-md"
                        layoutClassName="h-11 w-11 overflow-hidden"
                        borderClassName={active ? 'border-2 border-primary-500' : 'border border-slate-200 dark:border-slate-600'}>
                        <Image src={img} alt="" layoutClassName="h-full w-full object-cover" />
                      </Button>
                    );
                  })}
                </Box>
              ) : (
                <Typography size="xs" variant="muted">Upload ảnh ở trên để gán cho vị.</Typography>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Typography size="xs" variant="muted">Chưa có vị. Thêm ở dưới.</Typography>
      )}

      {/* Thêm vị mới */}
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
          Thêm
        </Button>
      </Box>
    </Card>
  );
};

export default FlavorVariantEditor;
