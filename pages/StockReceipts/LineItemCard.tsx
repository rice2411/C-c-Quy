import React from 'react';
import { Trash2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { BillLineItem, ImportedMaterialSummary } from '@/types/billReceipt';
import LineTypePicker from '@/pages/StockReceipts/LineTypePicker';
import MaterialLinePicker from '@/pages/StockReceipts/MaterialLinePicker';

const moneyFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

const parseNonNegative = (v: string): number | null => {
  if (v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.max(0, n);
};

/** Thành tiền = SL × Đơn giá khi có đủ 2; thiếu 1 trong 2 → giữ giá trị cũ (vd từ OCR). */
const recomputeTotal = (
  qty: number | null,
  price: number | null,
  prev: number | null,
): number | null => (qty != null && price != null ? Math.round(qty * price) : prev);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  layoutClassName?: string;
}> = ({ label, children, layoutClassName }) => (
  <Box layoutClassName={layoutClassName ?? 'space-y-1'}>
    <Typography as="span" size="xs" variant="muted" layoutClassName="block font-medium uppercase tracking-wide">
      {label}
    </Typography>
    {children}
  </Box>
);

export interface LineItemCardProps {
  idx: number;
  line: BillLineItem;
  materials: ImportedMaterialSummary[];
  onChange: (patch: Partial<BillLineItem>) => void;
  onRemove: () => void;
}

/**
 * 1 dòng mặt hàng dạng CARD (dùng chung mobile + desktop): tên (kèm khớp NVL) chiếm cả hàng,
 * lưới SL / Đơn vị / Đơn giá / Thành tiền, rồi Loại. Input controlled ổn định — không mất value.
 */
const LineItemCard: React.FC<LineItemCardProps> = ({ idx, line, materials, onChange, onRemove }) => {
  const isMaterial = (line.itemType ?? 'material') === 'material';
  return (
    <Box
      layoutClassName="space-y-3 rounded-xl border p-3 sm:p-4"
      borderClassName="border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-slate-50/60 dark:bg-slate-900/40"
    >
      <Box layoutClassName="flex items-start justify-between gap-3">
        <Typography size="xs" variant="muted" layoutClassName="mt-1 font-bold uppercase tracking-wider">
          #{idx + 1}
        </Typography>
        <Box layoutClassName="min-w-0 flex-1">
          <Field label="Tên mặt hàng">
            {isMaterial ? (
              <MaterialLinePicker
                value={line.name ?? ''}
                materials={materials}
                unit={line.unit}
                unitPrice={line.unitPrice}
                onChange={(patch) => onChange(patch)}
              />
            ) : (
              <Input
                value={line.name ?? ''}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Tên khoản"
              />
            )}
          </Field>
        </Box>
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          leftIcon={<Trash2 />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="p-2"
          roundedClassName="rounded-lg"
          borderClassName="border border-transparent"
          backgroundClassName="bg-transparent"
          textClassName="text-red-500 dark:text-red-400"
          hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Xoá dòng"
          disableVariantHover
          disableVariantTextColor
        />
      </Box>

      <Box layoutClassName="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Số lượng">
          <Input
            value={String(line.quantity ?? '')}
            onChange={(e) => {
              const q = parseNonNegative(e.target.value);
              onChange({ quantity: q, lineTotal: recomputeTotal(q, line.unitPrice ?? null, line.lineTotal ?? null) });
            }}
            placeholder="0"
            inputMode="decimal"
            textClassName="text-right"
          />
        </Field>
        <Field label="Đơn vị">
          <Input
            value={line.unit ?? ''}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="kg, gói…"
          />
        </Field>
        <Field label="Đơn giá (đ)">
          <Input
            value={String(line.unitPrice ?? '')}
            onChange={(e) => {
              const p = parseNonNegative(e.target.value);
              onChange({ unitPrice: p, lineTotal: recomputeTotal(line.quantity ?? null, p, line.lineTotal ?? null) });
            }}
            placeholder="0"
            inputMode="decimal"
            textClassName="text-right"
          />
        </Field>
        <Field label="Thành tiền (đ)">
          <Input
            value={line.lineTotal != null ? moneyFmt.format(line.lineTotal) : ''}
            readOnly
            placeholder="= SL × đơn giá"
            textClassName="text-right font-semibold"
            backgroundClassName="bg-slate-100 dark:bg-slate-800"
            title="Tự tính = Số lượng × Đơn giá"
          />
        </Field>
      </Box>

      <Field label="Phân loại">
        <LineTypePicker line={line} onChange={(patch) => onChange(patch)} />
      </Field>
    </Box>
  );
};

export default LineItemCard;
