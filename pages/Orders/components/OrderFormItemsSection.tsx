import React, { useEffect, useState } from 'react';
import { DollarSign, Package, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types';
import { FormItem } from '@/pages/Orders/components/modals/OrderForm';
import Box from '@/components/ui/Box';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import ProductSearchBar from '@/pages/Orders/components/ProductSearchBar';
import { formatVNDOrDash } from '@/utils/currencyUtil';

interface OrderItemsSectionProps {
  items: FormItem[];
  onAddItem: () => void;
  onAddItemWithProduct?: (product: Product) => void;
  onAddCustomItem?: (name: string) => void;
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
        <ProductSearchBar
          products={products}
          onPickProduct={onAddItemWithProduct}
          onPickCustom={onAddCustomItem}
        />
      ) : null}

      {items.length === 0 ? (
        <Box
          layoutClassName="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center dark:border-slate-700"
        >
          <Typography size="sm" variant="muted">
            Chưa có sản phẩm nào — gõ vào ô tìm kiếm phía trên để thêm.
          </Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-2">
          {items.map((item, index) => {
            const currentImage = getProductImage(item);
            const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
            const isHighlighted = recentlyAddedId === item.id;
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
                    <Typography size="xs" variant="muted">
                      {formatVNDOrDash(item.unitPrice)} × {item.quantity} ={' '}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatVNDOrDash(lineTotal)}
                      </span>
                    </Typography>
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

                <Box layoutClassName="mt-2 grid grid-cols-2 gap-2">
                  <Field
                    label={t('form.unitPrice')}
                    htmlFor={`order-item-price-${item.id}`}
                  >
                    <Input
                      id={`order-item-price-${item.id}`}
                      type="number"
                      min={0}
                      step={1000}
                      value={item.unitPrice}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          'unitPrice',
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      leftIcon={<DollarSign />}
                      leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                    />
                  </Field>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Field label={t('form.shippingCost')} htmlFor="order-form-shipping">
        <Box layoutClassName="relative">
          <Typography
            as="span"
            layoutClassName="absolute left-3 top-2.5 z-10 text-xs font-bold text-slate-400"
          >
            SHIP
          </Typography>
          <Input
            id="order-form-shipping"
            type="number"
            sizeClassName="pl-12"
            value={shippingInput}
            onChange={(e) => {
              const raw = e.target.value;
              setShippingInput(raw);
              if (raw === '') return;
              const parsed = Number(raw);
              if (!isNaN(parsed)) setShippingCost(Math.max(0, parsed));
            }}
            onBlur={() => {
              const parsed = Number(shippingInput);
              const normalized =
                shippingInput.trim() === '' || isNaN(parsed) ? 0 : Math.max(0, parsed);
              setShippingInput(String(normalized));
              setShippingCost(normalized);
            }}
          />
        </Box>
      </Field>

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
    </Box>
  );
};

export default OrderFormItemsSection;
