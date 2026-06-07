import React, { useMemo, useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { OrderDecoration } from '@/types/order';
import { MaterialPriceOption } from '@/services/stockReceiptService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import MaterialPickerModal from '@/pages/Orders/components/MaterialPickerModal';
import { formatVND } from '@/utils/format/currencyUtil';

interface Props {
  materials: MaterialPriceOption[];
  decorations: OrderDecoration[];
  onChange: (decorations: OrderDecoration[]) => void;
}

const OrderFormDecorationSection: React.FC<Props> = ({ materials, decorations, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Map materialId → tổng SL trong đơn (cho badge ×N trong modal)
  const currentQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    decorations.forEach((d) => {
      map[d.materialId] = (map[d.materialId] ?? 0) + d.quantity;
    });
    return map;
  }, [decorations]);

  // Bấm chọn nguyên liệu: đã có → +1, chưa có → thêm dòng mới (giá nhập TB)
  const handlePick = (m: MaterialPriceOption) => {
    const idx = decorations.findIndex((d) => d.materialId === m.id);
    if (idx >= 0) {
      onChange(decorations.map((d, i) => (i === idx ? { ...d, quantity: d.quantity + 1 } : d)));
    } else {
      onChange([...decorations, { materialId: m.id, name: m.name, quantity: 1, price: m.unitPrice }]);
    }
  };

  const handleDecrement = (materialId: string) => {
    const idx = decorations.findIndex((d) => d.materialId === materialId);
    if (idx < 0) return;
    const cur = decorations[idx];
    if (cur.quantity <= 1) onChange(decorations.filter((_, i) => i !== idx));
    else onChange(decorations.map((d, i) => (i === idx ? { ...d, quantity: d.quantity - 1 } : d)));
  };

  const handleRemove = (index: number) => onChange(decorations.filter((_, i) => i !== index));

  const updateRow = (index: number, patch: Partial<OrderDecoration>) =>
    onChange(decorations.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const totalQty = decorations.reduce((s, d) => s + d.quantity, 0);
  const total = decorations.reduce((s, d) => s + d.price * d.quantity, 0);

  return (
    <Box layoutClassName="space-y-3">
      <Heading
        level={3}
        layoutClassName="flex items-center gap-2 uppercase tracking-wider"
        textClassName="text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4 text-orange-500" /> Trang trí thêm
      </Heading>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={() => setPickerOpen(true)}
        layoutClassName="rounded-xl py-3"
        borderClassName="border-2 border-dashed border-slate-300 dark:border-slate-600"
        hoverClassName="hover:border-orange-400 hover:bg-orange-50 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
        leftIcon={<Plus className="h-4 w-4" />}
      >
        <Typography as="span" size="sm" layoutClassName="font-medium">Thêm trang trí</Typography>
        {totalQty > 0 ? (
          <Box
            layoutClassName="ml-1 inline-flex rounded-full px-2 py-0.5"
            backgroundClassName="bg-orange-100 dark:bg-orange-900/40"
          >
            <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-orange-700 dark:text-orange-300">{totalQty}</Typography>
          </Box>
        ) : null}
      </Button>

      {decorations.length > 0 ? (
        <Box layoutClassName="space-y-2">
          {decorations.map((d, idx) => {
            const lineTotal = d.price * d.quantity;
            return (
              <Box
                key={`${d.materialId}-${idx}`}
                layoutClassName="rounded-xl border border-slate-100 p-3 dark:border-slate-700"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/30"
              >
                <Box layoutClassName="flex items-center gap-3">
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography size="sm" layoutClassName="truncate font-semibold">{d.name}</Typography>
                    <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
                      {d.quantity} × {formatVND(d.price)} = <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-orange-600 dark:text-orange-400">{formatVND(lineTotal)}</Typography>
                    </Typography>
                  </Box>

                  <Box layoutClassName="w-24">
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={d.price}
                      onChange={(e) => updateRow(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                      sizeClassName="py-1.5 text-right text-sm"
                    />
                  </Box>
                  <Box layoutClassName="w-16">
                    <Input
                      type="number"
                      min={1}
                      value={d.quantity}
                      onChange={(e) => updateRow(idx, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                      sizeClassName="py-1.5 text-center text-sm"
                    />
                  </Box>
                  <IconButton
                    type="button"
                    label="Xoá trang trí"
                    variant="ghost"
                    layoutClassName="shrink-0 rounded-lg"
                    hoverClassName="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}

          <Box layoutClassName="flex items-center justify-between px-1">
            <Typography size="sm" variant="muted">Tổng trang trí</Typography>
            <Typography size="sm" layoutClassName="font-bold" textClassName="text-orange-600 dark:text-orange-400">
              {formatVND(total)}
            </Typography>
          </Box>
        </Box>
      ) : null}

      <MaterialPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        materials={materials}
        currentQuantities={currentQuantities}
        onPick={handlePick}
        onDecrement={handleDecrement}
      />
    </Box>
  );
};

export default OrderFormDecorationSection;
