import React, { useMemo } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import type { SurchargeTag } from '@/types/surchargeTag';
import type { SurchargeLine } from '@/types/order';
import { allocateSurcharge } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';

/** Dòng SP tối thiểu để tính + hiển thị preview chia phụ thu. */
export interface SurchargeItem {
  name: string;
  quantity: number;
}

interface Props {
  /** Phụ thu nhiều dòng: mỗi nhãn 1 số tiền riêng. */
  surcharges: SurchargeLine[];
  /** Danh sách tag động (đã lọc active, sort sortOrder ở caller). */
  surchargeTags: SurchargeTag[];
  items: SurchargeItem[];
  onChange: (surcharges: SurchargeLine[]) => void;
}

const OrderFormDecorationSection: React.FC<Props> = ({
  surcharges,
  surchargeTags,
  items,
  onChange,
}) => {
  const totalQty = useMemo(
    () => items.reduce((s, it) => s + Number(it.quantity || 0), 0),
    [items],
  );

  // Số tiền hiệu lực 1 dòng: theo SL (perUnit × tổng SL) hoặc cố định.
  const lineAmount = (l: SurchargeLine) =>
    Number(l.perUnit) > 0 ? Math.round(Number(l.perUnit) * totalQty) : (Number(l.amount) || 0);
  const totalSurcharge = useMemo(
    () => surcharges.reduce((s, x) => s + lineAmount(x), 0),
    [surcharges, totalQty],
  );

  // Chia TỔNG phụ thu theo qty (preview) — khớp BE allocateSurcharge.
  const shares = useMemo(
    () => allocateSurcharge(totalSurcharge, items),
    [totalSurcharge, items],
  );
  const perProduct = totalQty > 0 ? Math.round(totalSurcharge / totalQty) : 0;

  const hasTags = surchargeTags.length > 0;
  const hasSurcharge = totalSurcharge > 0;

  const addLine = (tag?: string, amount = 0) => onChange([...surcharges, { tag, amount }]);
  const updateLine = (idx: number, patch: Partial<SurchargeLine>) =>
    onChange(surcharges.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => onChange(surcharges.filter((_, i) => i !== idx));

  return (
    <Box layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Heading
          level={3}
          layoutClassName="flex items-center gap-2 uppercase tracking-wider"
          textClassName="text-sm font-semibold"
        >
          <Sparkles className="h-4 w-4 text-primary-500" /> Phụ thu
        </Heading>
        <Button
          type="button"
          variant="ghost"
          onClick={() => addLine(undefined, 0)}
          sizeClassName="px-2 py-1"
          roundedClassName="rounded-lg"
          shadowClassName=""
          borderClassName="border border-slate-200 dark:border-slate-600"
          backgroundClassName="bg-white dark:bg-slate-800"
          textClassName="text-xs font-medium text-slate-600 dark:text-slate-300"
          hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm dòng
        </Button>
      </Box>

      {/* Các dòng phụ thu: mỗi dòng 1 nhãn + 1 số tiền riêng */}
      {surcharges.length > 0 ? (
        <Box layoutClassName="space-y-2">
          {surcharges.map((line, idx) => (
            <Box key={idx} layoutClassName="flex items-end gap-2">
              <Box layoutClassName="min-w-0 flex-1">
                {idx === 0 ? <Label htmlFor={`surcharge-tag-${idx}`}>Nhãn</Label> : null}
                <Select
                  id={`surcharge-tag-${idx}`}
                  fullWidth
                  disabled={!hasTags}
                  value={line.tag ?? ''}
                  onChange={(e) => updateLine(idx, { tag: e.target.value || undefined })}
                >
                  <option value="">{hasTags ? '— Chọn nhãn —' : '— Chưa có nhãn —'}</option>
                  {surchargeTags.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box layoutClassName="min-w-0 w-44">
                {idx === 0 ? <Label htmlFor={`surcharge-amount-${idx}`}>Số tiền</Label> : null}
                <Box layoutClassName="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateLine(idx, line.perUnit !== undefined ? { perUnit: undefined } : { perUnit: 0, amount: 0 })}
                    sizeClassName="px-2 py-2 text-xs"
                    roundedClassName="rounded-lg"
                    shadowClassName=""
                    borderClassName="border border-slate-200 dark:border-slate-600"
                    backgroundClassName={line.perUnit !== undefined ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-slate-800'}
                    textClassName={line.perUnit !== undefined ? 'font-semibold text-primary-600 dark:text-primary-300' : 'text-slate-500'}
                    title="Đổi: cố định / theo số lượng sản phẩm"
                  >
                    {line.perUnit !== undefined ? '×SL' : 'đ'}
                  </Button>
                  <Input
                    id={`surcharge-amount-${idx}`}
                    type="number"
                    min={0}
                    step={1000}
                    value={line.perUnit !== undefined ? (line.perUnit || '') : line.amount}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value) || 0);
                      updateLine(idx, line.perUnit !== undefined ? { perUnit: v } : { amount: v });
                    }}
                    placeholder={line.perUnit !== undefined ? 'đ/sp' : '0'}
                    sizeClassName="py-2 text-right text-sm font-semibold"
                  />
                </Box>
                {line.perUnit !== undefined ? (
                  <Typography as="span" size="xs" variant="muted" layoutClassName="mt-0.5 block text-right">
                    {totalQty} sp × {formatVND(Number(line.perUnit) || 0)} = {formatVND(lineAmount(line))}
                  </Typography>
                ) : null}
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
                aria-label="Xoá dòng phụ thu"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Box>
          ))}
        </Box>
      ) : null}

      {/* Chip preset: bấm để THÊM 1 dòng phụ thu với mức gợi ý */}
      {hasTags ? (
        <Box layoutClassName="flex flex-wrap gap-2">
          {surchargeTags.map((s) => (
            <Button
              key={s.key}
              type="button"
              variant="ghost"
              onClick={() => addLine(s.key, s.preset)}
              sizeClassName="px-3 py-1"
              roundedClassName="rounded-full"
              shadowClassName=""
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-xs font-medium text-slate-600 dark:text-slate-300"
              hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
              stateClassName="transition-colors"
            >
              <Plus className="h-3 w-3" /> {s.label}
              <Typography
                as="span"
                size="xs"
                layoutClassName="ml-1"
                textClassName="text-slate-400 dark:text-slate-500"
              >
                · {s.preset > 0 ? formatVND(s.preset) : '0đ'}
              </Typography>
            </Button>
          ))}
        </Box>
      ) : null}

      {hasSurcharge ? (
        <Box
          layoutClassName="space-y-2 rounded-xl p-3"
          borderClassName="border border-dashed border-primary-300 dark:border-primary-700"
          backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
        >
          <Box layoutClassName="flex items-center justify-between gap-2">
            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-primary-700 dark:text-primary-300">
              Tổng phụ thu ({surcharges.filter((s) => Number(s.amount) > 0).length} khoản) · chia đều
            </Typography>
            <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-primary-700 dark:text-primary-300">
              {formatVND(totalSurcharge)}
            </Typography>
          </Box>

          {totalQty > 0 ? (
            <>
              <Typography as="p" size="xs" textClassName="text-primary-600 dark:text-primary-400">
                {formatVND(totalSurcharge)} ÷ {totalQty} sản phẩm ≈ {formatVND(perProduct)}/SP · làm tròn, dồn dư vào SP cuối
              </Typography>
              <Box
                layoutClassName="space-y-1 pt-2"
                borderClassName="border-t border-primary-200 dark:border-primary-800"
              >
                {items.map((it, idx) => (
                  <Box key={`${it.name}-${idx}`} layoutClassName="flex items-center justify-between gap-2">
                    <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">
                      {it.name} × {it.quantity}
                    </Typography>
                    <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-primary-700 dark:text-primary-300">
                      +{formatVND(shares[idx] ?? 0)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Typography as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">
              Thêm sản phẩm để chia phụ thu theo từng món.
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          layoutClassName="rounded-lg p-3 text-center"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50 dark:bg-slate-800/40"
        >
          <Typography as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Bấm nhãn để thêm 1 khoản phụ thu, hoặc "Thêm dòng" để nhập tay. Nhiều khoản sẽ tự cộng tổng.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderFormDecorationSection;
