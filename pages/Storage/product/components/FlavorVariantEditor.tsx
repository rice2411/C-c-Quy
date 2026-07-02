/**
 * FlavorVariantEditor — khai báo vị cho sản phẩm: chọn vị (từ danh sách quản lý, có màu),
 * mỗi vị gán ảnh riêng (chọn từ gallery sản phẩm) + giá riêng (tùy chọn).
 * Giá dòng đơn = tổng giá các vị chọn (nếu vị có đặt giá).
 */
import React from 'react';
import { IceCream } from 'lucide-react';
import type { ProductFlavorVariant } from '@/types';
import { flavorColor } from '@/types/flavor';
import { useFlavors } from '@/hooks/queries/useFlavorsQuery';
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
  const { flavors: allFlavors } = useFlavors();

  const has = (name: string) => variants.some((v) => v.name.toLowerCase() === name.toLowerCase());
  const toggle = (name: string) => {
    if (has(name)) onChange(variants.filter((v) => v.name.toLowerCase() !== name.toLowerCase()));
    else onChange([...variants, { name }]);
  };
  const patch = (name: string, p: Partial<ProductFlavorVariant>) =>
    onChange(variants.map((v) => (v.name === name ? { ...v, ...p } : v)));

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

      {/* Chọn vị áp dụng cho sản phẩm */}
      {allFlavors.length > 0 ? (
        <Box layoutClassName="flex flex-wrap gap-2">
          {allFlavors.map((fl) => {
            const selected = has(fl.name);
            const color = fl.color || '#64748b';
            return (
              <Button
                key={fl.id}
                type="button"
                onClick={() => toggle(fl.name)}
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="px-2.5 py-1 text-xs"
                roundedClassName="rounded-full"
                borderClassName="border"
                layoutClassName="inline-flex items-center gap-1.5"
                textClassName={selected ? 'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}
                stateClassName="transition-all"
                style={{ backgroundColor: selected ? color + '26' : 'transparent', borderColor: selected ? color : color + '80' }}>
                <Box layoutClassName="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                {fl.name}
                {selected ? <Typography as="span" size="xs" textClassName="text-emerald-600 dark:text-emerald-400">✓</Typography> : null}
              </Button>
            );
          })}
        </Box>
      ) : (
        <Typography size="xs" variant="muted">Chưa có vị nào. Tạo trong Cài đặt → Cài đặt sản phẩm → Vị.</Typography>
      )}

      {/* Ảnh + giá cho từng vị đã chọn */}
      {variants.length > 0 ? (
        <Box layoutClassName="flex flex-col gap-2">
          {variants.map((v) => (
            <Box
              key={v.name}
              layoutClassName="flex flex-col gap-2 rounded-lg p-2"
              borderClassName="border border-slate-100 dark:border-slate-700"
              backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
              <Box layoutClassName="flex items-center gap-2">
                <Box layoutClassName="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: flavorColor(v.name, allFlavors) }} />
                <Typography as="span" size="sm" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{v.name}</Typography>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={v.price ?? 0}
                  onChange={(e) => patch(v.name, { price: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="Giá"
                  backgroundClassName="bg-white dark:bg-slate-700"
                  containerClassName="w-28 shrink-0" />
              </Box>
              {/* Chọn ảnh cho vị từ gallery */}
              {galleryImages.length > 0 ? (
                <Box layoutClassName="flex flex-wrap gap-1.5">
                  {galleryImages.map((img) => {
                    const active = v.image === img;
                    return (
                      <Button
                        key={img}
                        type="button"
                        onClick={() => patch(v.name, { image: active ? undefined : img })}
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
      ) : null}
    </Card>
  );
};

export default FlavorVariantEditor;
