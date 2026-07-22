import React from 'react';
import { Layers, Plus, Trash2, PackagePlus } from 'lucide-react';
import type { PriceTier, PackagingOption, ProductType } from '@/types';
import { PRODUCT_TYPES } from '@/types/product';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';

interface Props {
  type: ProductType;
  setType: (t: ProductType) => void;
  basePrice: number;
  priceTiers: PriceTier[];
  setPriceTiers: (tiers: PriceTier[]) => void;
  packagingOptions: PackagingOption[];
  setPackagingOptions: (opts: PackagingOption[]) => void;
}

const ProductTypePricingSection: React.FC<Props> = ({
  type,
  setType,
  basePrice,
  priceTiers,
  setPriceTiers,
  packagingOptions,
  setPackagingOptions,
}) => {
  const addTier = () => setPriceTiers([...priceTiers, { minQty: 0, price: 0 }]);
  const updateTier = (idx: number, patch: Partial<PriceTier>) =>
    setPriceTiers(priceTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const removeTier = (idx: number) => setPriceTiers(priceTiers.filter((_, i) => i !== idx));

  const addOpt = () => setPackagingOptions([...packagingOptions, { label: '', perUnit: 0 }]);
  const updateOpt = (idx: number, patch: Partial<PackagingOption>) =>
    setPackagingOptions(packagingOptions.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const removeOpt = (idx: number) => setPackagingOptions(packagingOptions.filter((_, i) => i !== idx));

  return (
    <Box layoutClassName="space-y-5">
      <Field label="Phân loại sản phẩm">
        <Select value={type} onChange={(e) => setType(e.target.value as ProductType)} fullWidth>
          {PRODUCT_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {/* Giá bậc theo số lượng */}
      <Box layoutClassName="space-y-2">
        <Box layoutClassName="flex items-center justify-between gap-2">
          <Heading level={4} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold">
            <Layers className="h-4 w-4 text-primary-500" /> Giá bậc theo số lượng
          </Heading>
          <Button
            type="button"
            variant="ghost"
            onClick={addTier}
            sizeClassName="px-2 py-1 text-xs"
            roundedClassName="rounded-lg"
            shadowClassName=""
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            textClassName="text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm bậc
          </Button>
        </Box>
        <Typography as="p" size="xs" variant="muted">
          Giá/đơn vị áp khi TỔNG SL của sản phẩm này trong đơn ≥ mốc. Dưới mốc nhỏ nhất → dùng giá gốc ({formatVND(Number(basePrice) || 0)}).
        </Typography>
        {priceTiers.length > 0 ? (
          <Box layoutClassName="space-y-2">
            {priceTiers.map((tier, idx) => (
              <Box key={idx} layoutClassName="flex items-end gap-2">
                <Box layoutClassName="flex-1">
                  {idx === 0 ? <Typography as="span" size="xs" variant="muted">SL từ</Typography> : null}
                  <Input
                    type="number"
                    min={0}
                    value={tier.minQty || ''}
                    onChange={(e) => updateTier(idx, { minQty: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="vd 10"
                    fullWidth
                    sizeClassName="py-2 text-sm"
                  />
                </Box>
                <Box layoutClassName="flex-1">
                  {idx === 0 ? <Typography as="span" size="xs" variant="muted">Giá/đơn vị</Typography> : null}
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={tier.price || ''}
                    onChange={(e) => updateTier(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="vd 9000"
                    fullWidth
                    sizeClassName="py-2 text-right text-sm font-semibold"
                  />
                </Box>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeTier(idx)}
                  sizeClassName="p-2"
                  roundedClassName="rounded-lg"
                  shadowClassName=""
                  borderClassName="border border-transparent"
                  backgroundClassName="bg-transparent"
                  textClassName="text-slate-400 hover:text-rose-500"
                  hoverClassName="hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  aria-label="Xoá bậc giá"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography as="p" size="xs" variant="muted">Chưa có bậc — sản phẩm dùng giá gốc cho mọi số lượng.</Typography>
        )}
      </Box>

      {/* Option gói — cộng phí/đơn vị vào giá bậc */}
      <Box layoutClassName="space-y-2">
        <Box layoutClassName="flex items-center justify-between gap-2">
          <Heading level={4} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold">
            <PackagePlus className="h-4 w-4 text-primary-500" /> Option gói
          </Heading>
          <Button
            type="button"
            variant="ghost"
            onClick={addOpt}
            sizeClassName="px-2 py-1 text-xs"
            roundedClassName="rounded-lg"
            shadowClassName=""
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            textClassName="text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm option
          </Button>
        </Box>
        <Typography as="p" size="xs" variant="muted">
          Mỗi dòng đơn chọn 1 option; phí/đơn vị cộng vào giá bậc. Vd "Đóng gói" +2.000đ, "Gói hộp + thiệp" +6.000đ.
        </Typography>
        {packagingOptions.length > 0 ? (
          <Box layoutClassName="space-y-2">
            {packagingOptions.map((opt, idx) => (
              <Box key={idx} layoutClassName="flex items-end gap-2">
                <Box layoutClassName="flex-[2]">
                  {idx === 0 ? <Typography as="span" size="xs" variant="muted">Tên option</Typography> : null}
                  <Input
                    value={opt.label}
                    onChange={(e) => updateOpt(idx, { label: e.target.value })}
                    placeholder="vd Gói hộp + thiệp"
                    fullWidth
                    sizeClassName="py-2 text-sm"
                  />
                </Box>
                <Box layoutClassName="flex-1">
                  {idx === 0 ? <Typography as="span" size="xs" variant="muted">Phí/đơn vị</Typography> : null}
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={opt.perUnit || ''}
                    onChange={(e) => updateOpt(idx, { perUnit: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="vd 6000"
                    fullWidth
                    sizeClassName="py-2 text-right text-sm font-semibold"
                  />
                </Box>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeOpt(idx)}
                  sizeClassName="p-2"
                  roundedClassName="rounded-lg"
                  shadowClassName=""
                  borderClassName="border border-transparent"
                  backgroundClassName="bg-transparent"
                  textClassName="text-slate-400 hover:text-rose-500"
                  hoverClassName="hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  aria-label="Xoá option"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography as="p" size="xs" variant="muted">Chưa có option — dòng đơn dùng giá bậc, không cộng phí gói.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProductTypePricingSection;
