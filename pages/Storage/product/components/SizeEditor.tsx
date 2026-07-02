/**
 * SizeEditor — khai báo các size (biến thể giá) của sản phẩm: mỗi size = tên + giá.
 * Khi sản phẩm có size, giá bán dòng đơn lấy theo size chọn (giá gốc sản phẩm bị bỏ qua).
 */
import React, { useState } from 'react';
import { Ruler, Plus, Trash2 } from 'lucide-react';
import type { ProductSize } from '@/types';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

interface SizeEditorProps {
  sizes: ProductSize[];
  onChange: (sizes: ProductSize[]) => void;
}

const SizeEditor: React.FC<SizeEditorProps> = ({ sizes, onChange }) => {
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

  const update = (idx: number, patch: Partial<ProductSize>) => {
    onChange(sizes.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const remove = (idx: number) => onChange(sizes.filter((_, i) => i !== idx));

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center justify-between">
        <Box layoutClassName="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary-500" />
          <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">
            Size (biến thể giá)
          </Typography>
        </Box>
        <Typography as="span" size="xs" variant="muted">{sizes.length} size</Typography>
      </Box>

      {sizes.length > 0 ? (
        <Box layoutClassName="flex flex-col gap-2">
          {sizes.map((s, idx) => (
            <Box key={idx} layoutClassName="flex items-center gap-2">
              <Input
                type="text"
                value={s.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Tên size"
                backgroundClassName="bg-slate-50 dark:bg-slate-700"
                containerClassName="flex-1" />
              <Input
                type="number"
                min={0}
                step={1000}
                value={s.price}
                onChange={(e) => update(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                placeholder="Giá"
                backgroundClassName="bg-slate-50 dark:bg-slate-700"
                containerClassName="w-32 shrink-0" />
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
          ))}
        </Box>
      ) : (
        <Typography size="xs" variant="muted">Chưa có size. Để trống nếu sản phẩm bán 1 giá.</Typography>
      )}

      {/* Thêm size */}
      <Box layoutClassName="flex items-center gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Tên size mới (vd: Combo Gia Đình 5 cái)"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          containerClassName="flex-1" />
        <Input
          type="number"
          min={0}
          step={1000}
          value={price}
          onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Giá"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          containerClassName="w-32 shrink-0" />
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

export default SizeEditor;
