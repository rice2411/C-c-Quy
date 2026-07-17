import React from 'react';
import Box from '@/components/ui/Box';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { BillLineItem, LineItemType } from '@/types/billReceipt';
import { ASSET_CATEGORIES } from '@/types/asset';
import { EXPENSE_CATEGORIES } from '@/types/transaction';

const TYPE_OPTIONS: { value: LineItemType; label: string }[] = [
  { value: 'material', label: 'NVL' },
  { value: 'asset', label: 'Tài sản' },
  { value: 'opex', label: 'Vận hành' },
];

const typeLabel = (t?: LineItemType | null): string =>
  TYPE_OPTIONS.find((o) => o.value === t)?.label ?? '';

interface LineTypePickerProps {
  line: BillLineItem;
  onChange: (patch: Partial<BillLineItem>) => void;
}

/**
 * Phân loại 1 dòng phiếu nhập: NVL / Tài sản / Vận hành + field phụ inline
 * (số tháng KH khi Tài sản, loại chi phí khi Vận hành). Hiện gợi ý AI + nhắc
 * kiểm tra khi độ chắc thấp.
 */
const LineTypePicker: React.FC<LineTypePickerProps> = ({ line, onChange }) => {
  const type: LineItemType = line.itemType ?? 'material';
  const aiType = line.aiSuggestedType ?? null;
  const lowConf = aiType != null && (line.aiConfidence ?? 1) < 0.6;

  return (
    <Box layoutClassName="flex flex-col gap-1">
      <Select
        value={type}
        onChange={(e) => {
          const next = e.target.value as LineItemType;
          onChange({
            itemType: next,
            usefulMonths: next === 'asset' ? (line.usefulMonths ?? 24) : null,
            category:
              next === 'material' ? null : (line.category ?? (next === 'asset' ? 'equipment' : 'other')),
          });
        }}
        borderClassName={lowConf ? 'border-amber-400 dark:border-amber-500' : undefined}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      {aiType ? (
        <Typography as="span" size="xs" variant="muted" layoutClassName="truncate">
          🤖 {typeLabel(aiType)}{lowConf ? ' · nên kiểm tra' : ''}
        </Typography>
      ) : null}

      {type === 'asset' ? (
        <Input
          type="number"
          min={1}
          value={String(line.usefulMonths ?? '')}
          placeholder="Số tháng KH"
          onChange={(e) => onChange({ usefulMonths: e.target.value ? Number(e.target.value) : null })}
          fullWidth
        />
      ) : null}

      {type === 'opex' ? (
        <Select
          value={line.category ?? 'other'}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      ) : null}

      {type === 'asset' ? (
        <Select
          value={line.category ?? 'equipment'}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {ASSET_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      ) : null}
    </Box>
  );
};

export default LineTypePicker;
