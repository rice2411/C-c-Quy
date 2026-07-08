import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DollarSign, Minus, Package, Plus, RotateCcw, Trash2, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product, productUsesFlavorPricing, flavorSumPrice, flavorImage, flavorVariantColor, orderLineImage, sizeCountsCakes, sizeCountsPrice } from '@/types';
import { FormItem } from '@/pages/Orders/components/modals/OrderForm';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import EmptyState from '@/components/ui/EmptyState';
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
  // Lưu giá trị shipping > 0 cuối cùng để khôi phục khi user "Bỏ freeship"
  const lastNonZeroShipRef = useRef<number>(shippingCost > 0 ? shippingCost : 0);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setRecentIds(getRecentProductIds());
  }, []);

  useEffect(() => {
    setQuantityInputs((prev) => {
      const next: Record<string, string> = {};
      items.forEach((item) => {
        const qty = item.quantity ?? 1;
        const raw = prev[item.id];
        // Giữ nguyên ô input khi: đang gõ dở (rỗng) HOẶC giá trị đang khớp quantity.
        // Còn lại (quantity đổi từ ngoài: bấm +1/POS, quick-add) → đồng bộ lại theo quantity.
        next[item.id] =
          raw === '' || (raw !== undefined && Math.floor(Number(raw)) === qty)
            ? raw
            : String(qty);
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    setShippingInput(String(shippingCost ?? 0));
    // Track giá trị > 0 gần nhất để có thể restore khi bỏ freeship
    if (shippingCost > 0) lastNonZeroShipRef.current = shippingCost;
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
        <Package className="h-4 w-4 text-primary-500" /> {t('form.orderInfo')}
      </Heading>

      {onAddItemWithProduct ? (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => setPickerOpen(true)}
          layoutClassName="rounded-xl py-3"
          borderClassName="border-2 border-dashed border-slate-300 dark:border-slate-600"
          hoverClassName="hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          <Typography as="span" size="inherit" layoutClassName="font-medium">Thêm sản phẩm</Typography>
          {items.length > 0 ? (
            <Typography as="span" size="xs" layoutClassName="ml-1 rounded-full px-2 py-0.5 font-semibold" backgroundClassName="bg-primary-100 dark:bg-primary-900/40" textClassName="text-primary-700 dark:text-primary-300">
              {items.reduce((sum, it) => sum + (it.quantity || 0), 0)}
            </Typography>
          ) : null}
        </Button>
      ) : null}

      {recentChips.length > 0 && onAddItemWithProduct ? (
        <Box layoutClassName="space-y-1.5">
          <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">
            Hay dùng
          </Typography>
          <Box layoutClassName="flex flex-wrap gap-2">
            {recentChips.map((p) => {
              const qty = currentQuantities[p.id] || 0;
              return (
                <Button
                  type="button"
                  key={p.id}
                  onClick={() => onAddItemWithProduct(p)}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  layoutClassName="flex items-center gap-2 px-2.5 py-1"
                  sizeClassName="text-xs"
                  roundedClassName="rounded-full"
                  stateClassName="transition-colors"
                  borderClassName={qty > 0 ? 'border border-primary-300 dark:border-primary-700' : 'border border-slate-200 dark:border-slate-600'}
                  backgroundClassName={qty > 0 ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-white dark:bg-slate-800'}
                  hoverClassName={qty > 0 ? undefined : 'hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-700 dark:hover:bg-primary-950/30'}>
                  {p.image ? (
                    <Box layoutClassName="h-5 w-5 shrink-0 overflow-hidden rounded-full">
                      <Image src={p.image} alt={p.name} layoutClassName="h-full w-full object-cover" />
                    </Box>
                  ) : null}
                  <Typography as="span" size="inherit" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{p.name}</Typography>
                  {qty > 0 ? (
                    <Typography as="span" size="inherit" layoutClassName="rounded-full px-1.5 py-0.5 text-[10px] font-bold" backgroundClassName="bg-primary-500" textClassName="text-white">
                      ×{qty}
                    </Typography>
                  ) : (
                    <Typography as="span" size="inherit" textClassName="text-primary-600 dark:text-primary-400">{formatVNDOrDash(p.price)}</Typography>
                  )}
                </Button>
              );
            })}
          </Box>
        </Box>
      ) : null}

      {items.length === 0 && recentChips.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title='Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để chọn.'
        />
      ) : items.length > 0 ? (
        <Box layoutClassName="space-y-2">
          {items.map((item, index) => {
            const currentImage = getProductImage(item);
            const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
            const isHighlighted = recentlyAddedId === item.id;
            const isEditingPrice = editingPriceId === item.id;
            const itemProduct = products.find((p) => p.id === item.productId);
            const itemFlavors = itemProduct?.flavors ?? [];
            const itemSizes = itemProduct?.sizes ?? [];
            const isSized = itemSizes.length > 0;
            // sizeCounts: nhiều size + số lượng/dòng (fallback từ size đơn cũ).
            const sc = item.sizeCounts ?? (item.size ? [{ name: item.size, qty: item.quantity || 1 }] : []);
            // Tổng số cái (Σ qty×số cái mỗi size) = cap cho stepper vị.
            const totalCakes = itemProduct ? sizeCountsCakes(itemProduct, sc) : 0;
            const flavorCap = isSized ? totalCakes : Infinity;
            const pickedTotal = (item.flavors ?? []).length;
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
                    {isSized ? (
                      <Box layoutClassName="mt-1 flex flex-col gap-1">
                        <Typography as="span" size="xs" variant="muted">Loại (mỗi dòng 1 loại — thêm sản phẩm để có combo khác vị):</Typography>
                        <Box layoutClassName="flex flex-wrap gap-1.5">
                          {itemSizes.map((sz) => {
                            const selName = sc[0]?.name;
                            const active = selName === sz.name;
                            const cnt = sz.count ?? 1;
                            const pick = () => {
                              const qty = sc[0]?.qty ?? 1;
                              const nextSc = [{ name: sz.name, qty }];
                              onUpdateItem(item.id, 'sizeCounts', nextSc);
                              onUpdateItem(item.id, 'size', sz.name);
                              onUpdateItem(item.id, 'quantity', 1);
                              onUpdateItem(item.id, 'unitPrice', itemProduct ? sizeCountsPrice(itemProduct, nextSc) : 0);
                              if (itemProduct) {
                                const cakes = sizeCountsCakes(itemProduct, nextSc);
                                if ((item.flavors?.length ?? 0) > cakes) onUpdateItem(item.id, 'flavors', (item.flavors ?? []).slice(0, cakes));
                                const im = orderLineImage(itemProduct, { size: sz.name, flavors: item.flavors });
                                if (im) onUpdateItem(item.id, 'image', im);
                              }
                            };
                            return (
                              <Button key={sz.name} type="button" onClick={pick} variant="ghost" disableVariantHover disableVariantTextColor
                                layoutClassName="inline-flex items-center gap-1.5 px-2 py-1" roundedClassName="rounded-lg" sizeClassName="text-xs"
                                borderClassName={active ? 'border border-primary-400 dark:border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
                                backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-slate-800'}
                                textClassName={active ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300'}
                                hoverClassName="hover:border-primary-300 dark:hover:border-primary-700">
                                {sz.image ? (
                                  <Box layoutClassName="h-5 w-5 shrink-0 overflow-hidden rounded-md">
                                    <Image src={sz.image} alt="" layoutClassName="h-full w-full object-cover" />
                                  </Box>
                                ) : null}
                                <Typography as="span" size="inherit" layoutClassName="font-inherit">{sz.name}{cnt > 1 ? ` (${cnt} cái)` : ''} · {formatVNDOrDash(sz.price)}</Typography>
                              </Button>
                            );
                          })}
                        </Box>
                        {/* Số lượng của loại đang chọn (mặc định 1). Combo khác vị → bấm "Thêm sản phẩm". */}
                        <Box layoutClassName="mt-0.5 flex items-center gap-2">
                          <Typography as="span" size="xs" variant="muted">Số lượng:</Typography>
                          {(() => {
                            const cur = sc[0];
                            const setLineQty = (n: number) => {
                              if (!cur) return;
                              const nq = Math.max(1, n);
                              const nextSc = [{ name: cur.name, qty: nq }];
                              onUpdateItem(item.id, 'sizeCounts', nextSc);
                              onUpdateItem(item.id, 'unitPrice', itemProduct ? sizeCountsPrice(itemProduct, nextSc) : 0);
                              if (itemProduct) {
                                const cakes = sizeCountsCakes(itemProduct, nextSc);
                                if ((item.flavors?.length ?? 0) > cakes) onUpdateItem(item.id, 'flavors', (item.flavors ?? []).slice(0, cakes));
                              }
                            };
                            const q = cur?.qty ?? 1;
                            return (
                              <>
                                <Button type="button" onClick={() => setLineQty(q - 1)} disabled={q <= 1} aria-label="Bớt" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500 dark:text-slate-400" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Typography as="span" size="xs" layoutClassName="w-4 text-center font-semibold" textClassName="text-slate-800 dark:text-slate-100">{q}</Typography>
                                <Button type="button" onClick={() => setLineQty(q + 1)} aria-label="Thêm" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500 dark:text-slate-400" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    ) : null}
                    {itemFlavors.length > 0 ? (
                      <Box layoutClassName="mt-1 flex flex-col gap-1">
                        <Typography as="span" size="xs" variant="muted">
                          Vị{isSized ? ` (${pickedTotal}/${flavorCap})` : (pickedTotal ? ` (${pickedTotal})` : '')}:
                        </Typography>
                        <Box layoutClassName="flex flex-wrap gap-1.5">
                          {itemFlavors.map((fl) => {
                            const qty = (item.flavors ?? []).filter((x) => x === fl).length;
                            const cc = itemProduct ? flavorVariantColor(itemProduct, fl) : '#64748b';
                            const th = itemProduct ? flavorImage(itemProduct, fl) : undefined;
                            const apply = (arr: string[]) => {
                              onUpdateItem(item.id, 'flavors', arr);
                              if (itemProduct) {
                                if (isSized) {
                                  // Có size: giá + SL theo sizeCounts (không đổi ở đây).
                                } else if (productUsesFlavorPricing(itemProduct)) {
                                  // Giá theo vị: SL = tổng số cái, đơn giá = giá mỗi cái (tổng / SL).
                                  const total = arr.length;
                                  const sum = flavorSumPrice(itemProduct, arr);
                                  onUpdateItem(item.id, 'quantity', Math.max(1, total));
                                  onUpdateItem(item.id, 'unitPrice', total ? Math.round(sum / total) : (itemProduct.price || 0));
                                } else {
                                  // Vị không đặt giá: SL = tổng số cái, đơn giá = giá gốc.
                                  onUpdateItem(item.id, 'quantity', Math.max(1, arr.length));
                                }
                                const im = orderLineImage(itemProduct, { size: item.size, flavors: arr });
                                if (im) onUpdateItem(item.id, 'image', im);
                              }
                            };
                            const dec = () => { const a = [...(item.flavors ?? [])]; const i = a.indexOf(fl); if (i >= 0) { a.splice(i, 1); apply(a); } };
                            const inc = () => { if (!isSized || pickedTotal < flavorCap) apply([...(item.flavors ?? []), fl]); };
                            return (
                              <Box key={fl} layoutClassName="inline-flex items-center gap-1 rounded-full py-0.5 pl-1 pr-1.5" borderClassName="border" backgroundClassName="bg-white dark:bg-slate-800" style={{ borderColor: qty ? cc : cc + '80' }}>
                                {th ? (
                                  <Box layoutClassName="h-5 w-5 shrink-0 overflow-hidden rounded-full" borderClassName="border border-white/60 dark:border-slate-700">
                                    <Image src={th} alt="" layoutClassName="h-full w-full object-cover" />
                                  </Box>
                                ) : (
                                  <Box layoutClassName="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cc }} />
                                )}
                                <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{fl}</Typography>
                                <Button type="button" onClick={dec} disabled={qty === 0} aria-label="Bớt" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-0.5" roundedClassName="rounded-full" borderClassName="border border-transparent" textClassName="text-slate-400" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Typography as="span" size="xs" layoutClassName="w-3 text-center font-semibold" textClassName="text-slate-800 dark:text-slate-100">{qty}</Typography>
                                <Button type="button" onClick={inc} disabled={isSized && pickedTotal >= flavorCap} aria-label="Thêm" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-0.5" roundedClassName="rounded-full" borderClassName="border border-transparent" textClassName="text-slate-400" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ) : null}
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
                        <Button
                          type="button"
                          onClick={() => setEditingPriceId(item.id)}
                          title="Click để sửa đơn giá"
                          variant="ghost"
                          disableVariantHover
                          disableVariantTextColor
                          borderClassName="border-transparent"
                          layoutClassName="px-1 py-0.5"
                          roundedClassName="rounded"
                          textClassName="text-slate-500 dark:text-slate-400"
                          hoverClassName="hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                          {formatVNDOrDash(item.unitPrice)}
                        </Button>
                      )}
                      <Typography as="span" size="inherit" textClassName="text-slate-400">× {item.quantity}</Typography>
                      <Typography as="span" size="inherit" textClassName="text-slate-400">=</Typography>
                      <Typography as="span" size="inherit" layoutClassName="font-semibold" textClassName="text-primary-600 dark:text-primary-400">
                        {formatVNDOrDash(lineTotal)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box layoutClassName="flex items-center gap-2">
                    {!isSized ? (
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
                    ) : null}
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
      ) : null}

      {/* ===== Phí ship + nút Freeship ===== */}
      <Box
        layoutClassName="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 dark:border-slate-700"
        backgroundClassName="bg-slate-50/60 dark:bg-slate-900/60"
      >
        <Box layoutClassName="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">
            Phí ship:
          </Typography>
          <Typography size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingCost)}
          </Typography>
          {shippingCost === 0 ? (
            <Typography as="span" size="inherit" layoutClassName="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" backgroundClassName="bg-emerald-100 dark:bg-emerald-900/40" textClassName="text-emerald-700 dark:text-emerald-300">
              FREESHIP
            </Typography>
          ) : null}
        </Box>
        {shippingCost > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShippingCost(0)}
            leftIcon={<Truck />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            textClassName="font-semibold text-emerald-700 dark:text-emerald-300"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
            borderClassName="border border-emerald-200 dark:border-emerald-800"
            hoverClassName="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
          >
            Tặng freeship
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              // Khôi phục từ ref (giá trị > 0 cuối cùng), fallback shippingInput
              const fromRef = lastNonZeroShipRef.current;
              const fromInput = Number(shippingInput);
              const restored =
                fromRef > 0 ? fromRef
                : (Number.isFinite(fromInput) && fromInput > 0 ? fromInput : 0);
              if (restored > 0) setShippingCost(restored);
            }}
            leftIcon={<RotateCcw />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="px-3 py-1.5 text-xs"
            textClassName="font-semibold text-slate-700 dark:text-slate-200"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-600"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
            disableVariantTextColor
            disabled={lastNonZeroShipRef.current <= 0 && Number(shippingInput) <= 0}
          >
            Bỏ freeship
          </Button>
        )}
      </Box>

      <Box
        layoutClassName="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
        backgroundClassName="bg-slate-50 dark:bg-slate-900"
      >
        <Typography layoutClassName="font-medium" textClassName="text-slate-600 dark:text-slate-400">
          {t('form.totalEstimate')}
        </Typography>
        <Typography
          layoutClassName="text-lg font-bold"
          textClassName="text-primary-600 dark:text-primary-400"
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
