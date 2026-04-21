import React, { useEffect, useState } from 'react';
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
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';

interface OrderItemsSectionProps {
  items: FormItem[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof FormItem, value: any) => void;
  shippingCost: number;
  setShippingCost: (val: number) => void;
  total: number;
  products: Product[];
}

const OrderFormItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  shippingCost,
  setShippingCost,
  total,
  products
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
      <Box layoutClassName="flex items-center justify-between">
        <Heading
          level={3}
          layoutClassName="flex items-center gap-2 uppercase tracking-wider"
          textClassName="text-sm font-semibold"
        >
          <Package className="h-4 w-4 text-orange-500" /> {t('form.orderInfo')}
        </Heading>
        <Button
          type="button"
          onClick={onAddItem}
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          textClassName="text-xs font-medium text-orange-600 dark:text-orange-400"
          hoverClassName="hover:text-orange-700 dark:hover:text-orange-300"
          layoutClassName="gap-1"
          leftIcon={<Plus />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-3 [&_svg]:w-3"
        >
          Add Item
        </Button>
      </Box>

      <Box layoutClassName="space-y-6">
        {items.map((item, index) => {
          const currentImage = getProductImage(item);
          return (
            <Box
              key={item.id}
              layoutClassName="relative rounded-xl border border-slate-100 p-4 dark:border-slate-700"
              backgroundClassName="bg-slate-50 dark:bg-slate-700/30"
            >
              {items.length > 1 ? (
                <IconButton
                  type="button"
                  label="Remove item"
                  variant="ghost"
                  layoutClassName="absolute right-2 top-2 rounded-lg"
                  hoverClassName="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              ) : null}

              <Box layoutClassName="flex flex-col gap-4 sm:flex-row">
                <Box layoutClassName="flex shrink-0 justify-center sm:justify-start">
                  <Box
                    layoutClassName="relative h-20 w-20 overflow-hidden"
                    roundedClassName="rounded-lg"
                    borderClassName="border border-slate-200 dark:border-slate-600"
                    shadowClassName="shadow-sm"
                  >
                    <Image
                      src={currentImage}
                      alt="Product Preview"
                      layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-700"
                    />
                  </Box>
                </Box>

                <Box layoutClassName="flex-1 space-y-3">
                  <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field
                      label={`${t('form.productType')} ${items.length > 1 ? `#${index + 1}` : ''}`}
                      htmlFor={`order-item-product-${item.id}`}
                    >
                      <Select
                        id={`order-item-product-${item.id}`}
                        fullWidth
                        value={item.productId || ''}
                        onChange={(e) => onUpdateItem(item.id, 'productId', e.target.value || '')}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                        {!item.productId && item.productName ? (
                          <option value="" disabled>
                            {item.productName}
                          </option>
                        ) : null}
                      </Select>
                    </Field>
                  </Box>

                  <Box layoutClassName="grid grid-cols-3 gap-3">
                    <Field label={t('form.quantity')} htmlFor={`order-item-qty-${item.id}`}>
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
                              [item.id]: String(Math.max(1, item.quantity || 1))
                            }));
                            onUpdateItem(item.id, 'quantity', Math.max(1, item.quantity || 1));
                            return;
                          }
                          const parsed = Math.floor(Number(raw));
                          const normalized = !isNaN(parsed)
                            ? Math.max(1, parsed)
                            : Math.max(1, item.quantity || 1);
                          setQuantityInputs((prev) => ({ ...prev, [item.id]: String(normalized) }));
                          onUpdateItem(item.id, 'quantity', normalized);
                        }}
                      />
                    </Field>
                    <Box layoutClassName="col-span-2">
                      <Field label={t('form.unitPrice')} htmlFor={`order-item-price-${item.id}`}>
                        <Input
                          id={`order-item-price-${item.id}`}
                          type="number"
                          min={0}
                          step={1000}
                          value={item.unitPrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))
                          }
                          leftIcon={<DollarSign />}
                          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                        />
                      </Field>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

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
        <Typography layoutClassName="text-lg font-bold" textClassName="text-orange-600 dark:text-orange-400">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderFormItemsSection;
