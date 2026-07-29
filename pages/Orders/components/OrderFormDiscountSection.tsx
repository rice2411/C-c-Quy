import React, { useMemo } from 'react';
import { TicketPercent, Plus, Trash2 } from 'lucide-react';
import type { DiscountLine } from '@/types/order';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Typography from '@/components/ui/Typography';

interface Props {
  /** Giảm giá tay nhiều dòng: mỗi dòng 1 ghi chú + 1 số tiền. */
  discounts: DiscountLine[];
  onChange: (discounts: DiscountLine[]) => void;
}

const OrderFormDiscountSection: React.FC<Props> = ({ discounts, onChange }) => {
  const total = useMemo(
    () => discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    [discounts],
  );
  const hasDiscount = total > 0;

  const addLine = () => onChange([...discounts, { note: '', amount: 0 }]);
  const updateLine = (idx: number, patch: Partial<DiscountLine>) =>
    onChange(discounts.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => onChange(discounts.filter((_, i) => i !== idx));

  return (
    <Box layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Heading
          level={3}
          layoutClassName="flex items-center gap-2 uppercase tracking-wider"
          textClassName="text-sm font-semibold"
        >
          <TicketPercent className="h-4 w-4 text-rose-500" /> Giảm giá
        </Heading>
        <Button
          type="button"
          variant="ghost"
          onClick={addLine}
          sizeClassName="px-2 py-1"
          roundedClassName="rounded-lg"
          shadowClassName=""
          borderClassName="border border-slate-200 dark:border-slate-600"
          backgroundClassName="bg-white dark:bg-slate-800"
          textClassName="text-xs font-medium text-slate-600 dark:text-slate-300"
          hoverClassName="hover:border-rose-300 dark:hover:border-rose-700"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm dòng
        </Button>
      </Box>

      {discounts.length > 0 ? (
        <Box layoutClassName="space-y-2">
          {discounts.map((line, idx) => (
            <Box key={idx} layoutClassName="flex items-end gap-2">
              <Box layoutClassName="min-w-0 flex-1">
                {idx === 0 ? <Label htmlFor={`discount-note-${idx}`}>Ghi chú</Label> : null}
                <Input
                  id={`discount-note-${idx}`}
                  type="text"
                  value={line.note ?? ''}
                  onChange={(e) => updateLine(idx, { note: e.target.value })}
                  placeholder="Lý do giảm (vd: khách quen, sinh nhật…)"
                  sizeClassName="py-2 text-sm"
                />
              </Box>
              <Box layoutClassName="min-w-0 w-40">
                {idx === 0 ? <Label htmlFor={`discount-amount-${idx}`}>Số tiền giảm</Label> : null}
                <Input
                  id={`discount-amount-${idx}`}
                  type="number"
                  min={0}
                  step={1000}
                  value={line.amount || ''}
                  onChange={(e) =>
                    updateLine(idx, { amount: Math.max(0, Number(e.target.value) || 0) })
                  }
                  placeholder="0"
                  sizeClassName="py-2 text-right text-sm font-semibold"
                />
              </Box>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeLine(idx)}
                sizeClassName="p-2"
                roundedClassName="rounded-lg"
                shadowClassName=""
                borderClassName="border border-transparent"
                backgroundClassName="bg-transparent"
                textClassName="text-slate-400 hover:text-rose-500"
                hoverClassName="hover:bg-rose-50 dark:hover:bg-rose-900/20"
                aria-label="Xoá dòng giảm giá"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Box>
          ))}
        </Box>
      ) : null}

      {hasDiscount ? (
        <Box
          layoutClassName="flex items-center justify-between gap-2 rounded-xl p-3"
          borderClassName="border border-dashed border-rose-300 dark:border-rose-700"
          backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
        >
          <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-rose-700 dark:text-rose-300">
            Tổng giảm giá ({discounts.filter((d) => Number(d.amount) > 0).length} khoản)
          </Typography>
          <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-rose-700 dark:text-rose-300">
            −{formatVND(total)}
          </Typography>
        </Box>
      ) : (
        <Box
          layoutClassName="rounded-lg p-3 text-center"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50 dark:bg-slate-800/40"
        >
          <Typography as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Bấm "Thêm dòng" để nhập khoản giảm giá (ghi chú + số tiền). Nhiều khoản sẽ tự cộng tổng, trừ vào tổng đơn.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderFormDiscountSection;
