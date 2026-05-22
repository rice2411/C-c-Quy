import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Package, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types';
import { FormItem } from '@/pages/Orders/components/modals/OrderForm';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import ProductPickerModal from '@/pages/Orders/components/ProductPickerModal';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import { getRecentProductIds } from '@/utils/product/recentProducts';

interface OrderItemsSectionProps {
  items: FormItem[];
  onAddItem: () => void;
  onAddItemWithProduct?: (product: Product) => void;
  onAddCustomItem?: (name: string) => void;
  onDecrementProduct?: (productId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof FormItem, value: any) => void;
  shippingCost: number;
  setShippingCost: (val: number) => void;
  total: number;
  products: Product[];
  recentlyAddedId?: string | null;
}

const OrderFormItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  onAddItemWithProduct,
  onAddCustomItem,
  onDecrementProduct,
  onRemoveItem,
  onUpdateItem,
  shippingCost,
  setShippingCost,
  total,
  products,
  recentlyAddedId,
}) => {
  const { t } = useLanguage();
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [shippingInput, setShippingInput] = useState<string>(String(shippingCost ?? 0));
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setRecentIds(getRecentProductIds());
  }, [items.length, products.length]);

  useEffect(() => {
    setQuantityInputs((prev) => {
      const next: Record<string, string> = {};
      items.forEach((item) => {
        next[item.id] = prev[item.id] ?? String(item.quantity ?? 1);
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    setShippingInput(String(shippingCost ?? 0));
  }, [shippingCost]);

  const getProductImage = (item: FormItem) => {
    if (item.image) return item.image;
    const displayText = item.productName || 'Product';
    return `https://placehold.co/200x200?text=${encodeURIComponent(displayText)}`;
  };

  // Map productId -> quantity currently in order
  const currentQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      if (it.productId) {
        map[it.productId] = (map[it.productId] || 0) + (it.quantity || 0);
      }
    });
    return map;
  }, [items]);

  // Recent products -> resolve to Product objects, max 6
  const recentChips = useMemo(() => {
    return recentIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 6);
  }, [recentIds, products]);

  return (
    <Box layoutClassName="space-y-4">
      <Heading
        level={3}
        layoutClassName="flex items-center gap-2 uppercase tracking-wider"
        textClassName="text-sm font-semibold"
      >
        <Package className="h-4 w-4 text-orange-500" /> {t('form.orderInfo')}
      </Heading>

      {onAddItemWithProduct ? (
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
          <span className="font-medium">Thêm sản phẩm</span>
          {items.length > 0 ? (
            <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {items.reduce((sum, it) => sum + (it.quantity || 0), 0)}
            </span>
          ) : null}
        </Button>
      ) : null}

      {items.length === 0 ? (
        <Box
          layoutClassName="rounded-xl border-2 border-dashed border-slate-200 p-4 dark:border-slate-700"
        >
          {recentChips.length > 0 && onAddItemWithProduct ? (
            <>
              <Typography size="xs" variant="muted" layoutClassName="mb-2 font-medium uppercase tracking-wide">
                Hay dùng
              </Typography>
              <Box layoutClassName="flex flex-wrap gap-2">
                {recentChips.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => onAddItemWithProduct(p)}
                    className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs transition-colors hover:border-orange-300 hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                      />
                    ) : null}
                    <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {formatVNDOrDash(p.price)}
                    </span>
                  </button>
                ))}
              </Box>
            </>
          ) : (
            <Typography size="sm" variant="muted" layoutClassName="text-center">
              Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để chọn.
            </Typography>
          )}
        </Box>
      ) : (
        <Box layoutClassName="space-y-2">
          {items.map((item, index) => {
            const currentImage = getProductImage(item);
            const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
            const isHighlighted = recentlyAddedId === item.id;
            const isEditingPrice = editingPriceId === item.id;
            return (
              <Box
                key={item.id}
                layoutClassName="relative rounded-xl border p-3 transition-colors duration-500"
                borderClassName={
                  isHighlighted
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-slate-100 dark:border-slate-700'
                }
                backgroundClassName={
                  isHighlighted
                    ? 'bg-emerald-50 dark:bg-emerald-900/30'
                    : 'bg-slate-50 dark:bg-slate-700/30'
                }
              >
                <Box layoutClassName="flex items-center gap-3">
                  <Box
                    layoutClassName="relative h-14 w-14 shrink-0 overflow-hidden"
                    roundedClassName="rounded-lg"
                    borderClassName="border border-slate-200 dark:border-slate-600"
                  >
                    <Image
                      src={currentImage}
                      alt={item.productName || `Item #${index + 1}`}
                      layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-700"
                    />
                  </Box>

                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography size="sm" layoutClassName="truncate font-semibold">
                      {item.productName || `Item #${index + 1}`}
                    </Typography>
                    <Box layoutClassName="mt-0.5 flex items-center gap-1 text-xs">
                      {isEditingPrice ? (
                        <Input
                          autoFocus
                          type="number"
                          min={0}
                          step={1000}
                          value={item.unitPrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))
                          }
                          onBlur={() => setEditingPriceId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingPriceId(null);
                            }
                          }}
                          leftIcon={<DollarSign />}
                          leftIconClassName="[&_svg]:h-3.5 [&_svg]:w-3.5"
                          containerClassName="w-32"
                          size="sm"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingPriceId(item.id)}
                          className="rounded px-1 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          title="Click để sửa đơn giá"
                        >
                          {formatVNDOrDash(item.unitPrice)}
                        </button>
                      )}
                      <span className="text-slate-400">× {item.quantity}</span>
                      <span className="text-slate-400">=</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatVNDOrDash(lineTotal)}
                      </span>
                    </Box>
                  </Box>

                  <Box layoutClassName="flex items-center gap-2">
                    <Box layoutClassName="w-20">
                      <Input
                        id={`order-item-qty-${item.id}`}
                        type="number"
                        min={1}
                        value={quantityInputs[item.id] ?? String(item.quantity)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setQuantityInputs((prev) => ({ ...prev, [item.id]: raw }));
                          if (raw === '') return;
                          const parsed = Math.floor(Number(raw));
                          if (!isNaN(parsed)) {
                            onUpdateItem(item.id, 'quantity', Math.max(1, parsed));
                          }
                        }}
                        onBlur={() => {
                          const raw = quantityInputs[item.id];
                          if (raw === undefined || raw === '') {
                            setQuantityInputs((prev) => ({
                              ...prev,
                              [item.id]: String(Math.max(1, item.quantity || 1)),
                            }));
                            onUpdateItem(item.id, 'quantity', Math.max(1, item.quantity || 1));
                            return;
                          }
                          const parsed = Math.floor(Number(raw));
                          const normalized = !isNaN(parsed)
                            ? Math.max(1, parsed)
                            : Math.max(1, item.quantity || 1);
                          setQuantityInputs((prev) => ({
                            ...prev,
                            [item.id]: String(normalized),
                          }));
                          onUpdateItem(item.id, 'quantity', normalized);
                        }}
                        sizeClassName="text-center"
                      />
                    </Box>
                    <IconButton
                      type="button"
                      label="Remove item"
                      variant="ghost"
                      layoutClassName="shrink-0 rounded-lg"
                      hoverClassName="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Input phí ship đã được xoá — phí ship tự tính từ AddressMapInput
          (auto-fill qua onShipFeeChange khi user nhập địa chỉ + bấm Enter).
          shippingCost vẫn được dùng để tính total nhưng không cho user sửa tay nữa. */}

      <Box
        layoutClassName="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
        backgroundClassName="bg-slate-50 dark:bg-slate-900"
      >
        <Typography layoutClassName="font-medium" textClassName="text-slate-600 dark:text-slate-400">
          {t('form.totalEstimate')}
        </Typography>
        <Typography
          layoutClassName="text-lg font-bold"
          textClassName="text-orange-600 dark:text-orange-400"
        >
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
        </Typography>
      </Box>

      {onAddItemWithProduct ? (
        <ProductPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          products={products}
          currentQuantities={currentQuantities}
          onPickProduct={onAddItemWithProduct}
          onDecrementProduct={onDecrementProduct}
          onPickCustom={onAddCustomItem}
        />
      ) : null}
    </Box>
  );
};

export default OrderFormItemsSection;
