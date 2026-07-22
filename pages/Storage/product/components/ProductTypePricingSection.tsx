import React from 'react';
import { Layers, Plus, Trash2, PackagePlus } from 'lucide-react';
import type { Product, PriceTier, ProductType } from '@/types';
import { PRODUCT_TYPES, productTypeLabel } from '@/types/product';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
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
  addOnProductIds: string[];
  setAddOnProductIds: (ids: string[]) => void;
  /** Toàn bộ sản phẩm (để chọn add-on). */
  allProducts: Product[];
  /** id SP hiện tại (loại khỏi danh sách add-on). */
  currentId?: string;
}

/** Loại SP được coi là "phụ phí" — hiện trong danh sách chọn add-on. */
const ADDON_TYPES: ProductType[] = ['packaging', 'decoration', 'accessory', 'service'];

const ProductTypePricingSection: React.FC<Props> = ({
  type,
  setType,
  basePrice,
  priceTiers,
  setPriceTiers,
  addOnProductIds,
  setAddOnProductIds,
  allProducts,
  currentId,
}) => {
  const addTier = () => setPriceTiers([...priceTiers, { minQty: 0, price: 0 }]);
  const updateTier = (idx: number, patch: Partial<PriceTier>) =>
    setPriceTiers(priceTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const removeTier = (idx: number) => setPriceTiers(priceTiers.filter((_, i) => i !== idx));

  const toggleAddOn = (id: string) =>
    setAddOnProductIds(
      addOnProductIds.includes(id)
        ? addOnProductIds.filter((x) => x !== id)
        : [...addOnProductIds, id],
    );

  const addOnCandidates = allProducts.filter(
    (p) => p.id !== currentId && ADDON_TYPES.includes((p.type as ProductType) ?? 'cake'),
  );

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

      {/* Add-on tự thêm theo hộp */}
      <Box layoutClassName="space-y-2">
        <Heading level={4} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold">
          <PackagePlus className="h-4 w-4 text-primary-500" /> Phụ phí gói tự thêm
        </Heading>
        <Typography as="p" size="xs" variant="muted">
          Khi thêm sản phẩm này vào đơn, các sản phẩm chọn dưới đây tự thêm theo (số lượng đồng bộ). Chỉ hiện SP loại đóng gói / trang trí / phụ kiện / dịch vụ.
        </Typography>
        {addOnCandidates.length > 0 ? (
          <Box layoutClassName="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {addOnCandidates.map((p) => (
              <Checkbox
                key={p.id}
                checked={addOnProductIds.includes(p.id)}
                onChange={() => toggleAddOn(p.id)}
                label={`${p.name} · ${formatVND(Number(p.price) || 0)} (${productTypeLabel(p.type)})`}
              />
            ))}
          </Box>
        ) : (
          <Typography as="p" size="xs" variant="muted">
            Chưa có sản phẩm loại phụ phí. Tạo SP loại "Đóng gói / Trang trí / Phụ kiện / Dịch vụ" trước.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProductTypePricingSection;
