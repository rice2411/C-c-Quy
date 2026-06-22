import React, { useMemo } from 'react';
import { Sparkles, Pencil } from 'lucide-react';
import type { SurchargeTag } from '@/types/surchargeTag';
import { surchargeTagLabel } from '@/types/surchargeTag';
import { allocateSurcharge } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';
import Badge from '@/components/ui/Badge';
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
  surchargeAmount: number;
  /** `key` của tag đang chọn (đơn lưu string). */
  surchargeTag?: string;
  /** Danh sách tag động (đã lọc active, sort sortOrder ở caller). */
  surchargeTags: SurchargeTag[];
  items: SurchargeItem[];
  onAmountChange: (amount: number) => void;
  onTagChange: (tag: string | undefined) => void;
}

const OrderFormDecorationSection: React.FC<Props> = ({
  surchargeAmount,
  surchargeTag,
  surchargeTags,
  items,
  onAmountChange,
  onTagChange,
}) => {
  const totalQty = useMemo(
    () => items.reduce((s, it) => s + Number(it.quantity || 0), 0),
    [items],
  );

  // Chia phụ thu theo qty (preview) — khớp BE allocateSurcharge.
  const shares = useMemo(
    () => allocateSurcharge(surchargeAmount, items),
    [surchargeAmount, items],
  );

  const perProduct = totalQty > 0 ? Math.round(surchargeAmount / totalQty) : 0;

  // "Sửa tay": tổng phụ thu khác mức gợi ý của nhãn đang chọn.
  const presetOfTag = surchargeTags.find((s) => s.key === surchargeTag)?.preset;
  const isManual =
    surchargeTag != null && presetOfTag != null && surchargeAmount !== presetOfTag;

  const hasTags = surchargeTags.length > 0;

  // Bấm chip preset: điền cả nhãn + mức gợi ý.
  const handlePreset = (tag: string, preset: number) => {
    onTagChange(tag);
    onAmountChange(preset);
  };

  const hasSurcharge = surchargeAmount > 0;

  return (
    <Box layoutClassName="space-y-3">
      <Heading
        level={3}
        layoutClassName="flex items-center gap-2 uppercase tracking-wider"
        textClassName="text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4 text-primary-500" /> Phụ thu
      </Heading>

      <Box layoutClassName="flex flex-col gap-3 sm:flex-row">
        <Box layoutClassName="min-w-0 sm:flex-[1.2]">
          <Label htmlFor="order-form-surcharge-amount">
            Tổng phụ thu (cả đơn)
            {isManual ? (
              <Badge
                size="sm"
                layoutClassName="ml-2 align-middle"
                borderClassName="border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-slate-100 dark:bg-slate-700"
                textClassName="text-slate-500 dark:text-slate-300"
              >
                <Pencil className="h-3 w-3" /> sửa tay
              </Badge>
            ) : null}
          </Label>
          <Input
            id="order-form-surcharge-amount"
            type="number"
            min={0}
            step={1000}
            value={surchargeAmount}
            onChange={(e) => onAmountChange(Math.max(0, Number(e.target.value) || 0))}
            sizeClassName="py-2 text-right text-sm font-semibold"
          />
        </Box>
        <Box layoutClassName="min-w-0 sm:flex-1">
          <Label htmlFor="order-form-surcharge-tag">Nhãn</Label>
          <Select
            id="order-form-surcharge-tag"
            fullWidth
            disabled={!hasTags}
            value={surchargeTag ?? ''}
            onChange={(e) =>
              onTagChange(e.target.value ? e.target.value : undefined)
            }
          >
            <option value="">{hasTags ? '— Chọn nhãn —' : '— Chưa có nhãn —'}</option>
            {surchargeTags.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </Box>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {surchargeTags.map((s) => {
          const active = surchargeTag === s.key;
          return (
            <Button
              key={s.key}
              type="button"
              variant="ghost"
              onClick={() => handlePreset(s.key, s.preset)}
              sizeClassName="px-3 py-1"
              roundedClassName="rounded-full"
              shadowClassName=""
              borderClassName={
                active
                  ? 'border border-primary-300 dark:border-primary-700'
                  : 'border border-slate-200 dark:border-slate-600'
              }
              backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-slate-800'}
              textClassName={
                active
                  ? 'text-xs font-medium text-primary-700 dark:text-primary-300'
                  : 'text-xs font-medium text-slate-600 dark:text-slate-300'
              }
              hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
              stateClassName="transition-colors"
            >
              {s.label}
              <Typography
                as="span"
                size="xs"
                layoutClassName="ml-1"
                textClassName={active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}
              >
                · {s.preset > 0 ? formatVND(s.preset) : '0đ'}
              </Typography>
            </Button>
          );
        })}
      </Box>

      {hasSurcharge ? (
        <Box
          layoutClassName="space-y-2 rounded-xl p-3"
          borderClassName="border border-dashed border-primary-300 dark:border-primary-700"
          backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
        >
          <Box layoutClassName="flex items-center justify-between gap-2">
            <Box layoutClassName="flex items-center gap-2">
              <Badge
                size="sm"
                borderClassName="border-primary-300 dark:border-primary-700"
                backgroundClassName="bg-white dark:bg-slate-800"
                textClassName="text-primary-700 dark:text-primary-300"
              >
                <Sparkles className="h-3 w-3" /> {surchargeTagLabel(surchargeTag, surchargeTags)}
              </Badge>
              <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-primary-700 dark:text-primary-300">
                chia đều
              </Typography>
            </Box>
            <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-primary-700 dark:text-primary-300">
              {formatVND(surchargeAmount)}
            </Typography>
          </Box>

          {totalQty > 0 ? (
            <>
              <Typography as="p" size="xs" textClassName="text-primary-600 dark:text-primary-400">
                {formatVND(surchargeAmount)} ÷ {totalQty} sản phẩm ≈ {formatVND(perProduct)}/SP · làm tròn, dồn dư vào SP cuối
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
            Chọn nhãn để điền mức gợi ý, hoặc nhập tổng tay. Phụ thu sẽ tự chia đều cho các sản phẩm.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderFormDecorationSection;
