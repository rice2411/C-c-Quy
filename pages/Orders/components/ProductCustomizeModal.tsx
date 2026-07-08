/**
 * ProductCustomizeModal — tuỳ chỉnh 1 món kiểu Grab: ảnh + chọn size (radio) + chọn vị
 * (stepper theo số cái) + số lượng + tổng tiền → "Thêm vào đơn" / "Cập nhật".
 * Mỗi lần thêm = 1 DÒNG cấu hình riêng (combo khác vị = thêm nhiều lần).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Minus, Plus, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';
import type { Product } from '@/types';
import {
  productUsesFlavorPricing, flavorSumPrice, flavorImage, flavorVariantColor,
  sizeCount, sizeCountsPrice, sizeCountsCakes, sizeImage, orderLineImage,
} from '@/types';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';

export interface CustomizeConfig {
  sizeCounts?: { name: string; qty: number }[];
  size?: string;
  flavors?: string[];
  quantity: number;
  unitPrice: number;
  image?: string;
}

interface Props {
  open: boolean;
  product: Product | null;
  /** Cấu hình có sẵn khi SỬA 1 dòng. */
  initial?: CustomizeConfig | null;
  onClose: () => void;
  onConfirm: (cfg: CustomizeConfig) => void;
}

const ProductCustomizeModal: React.FC<Props> = ({ open, product, initial, onClose, onConfirm }) => {
  const sizes = product?.sizes ?? [];
  const flavorVars = product?.flavorVariants ?? [];
  const hasSize = sizes.length > 0;
  const hasFlavor = (product?.flavors?.length ?? 0) > 0 && flavorVars.length > 0;
  const editing = !!initial;

  const [sizeName, setSizeName] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [flavors, setFlavors] = useState<string[]>([]);

  // Nạp state mỗi khi mở.
  useEffect(() => {
    if (!open || !product) return;
    setSizeName(initial?.size ?? initial?.sizeCounts?.[0]?.name ?? sizes[0]?.name ?? '');
    setQty(initial?.sizeCounts?.[0]?.qty ?? (hasSize ? 1 : Math.max(1, initial?.quantity ?? 1)));
    setFlavors(initial?.flavors ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const cakesPerUnit = product && hasSize && sizeName ? (sizeCount(product, sizeName) ?? 1) : 1;
  const flavorCap = hasSize ? cakesPerUnit * qty : Infinity;
  const pickedTotal = flavors.length;

  // Ảnh + giá + tổng theo cấu hình hiện tại.
  const { unitPrice, quantity, lineTotal, heroImg } = useMemo(() => {
    if (!product) return { unitPrice: 0, quantity: 1, lineTotal: 0, heroImg: undefined as string | undefined };
    if (hasSize) {
      const sc = [{ name: sizeName, qty }];
      const up = sizeCountsPrice(product, sc);
      return { unitPrice: up, quantity: 1, lineTotal: up, heroImg: sizeImage(product, sizeName) || product.image };
    }
    if (productUsesFlavorPricing(product) && flavors.length > 0) {
      const sum = flavorSumPrice(product, flavors);
      return { unitPrice: flavors.length ? Math.round(sum / flavors.length) : product.price, quantity: flavors.length, lineTotal: sum, heroImg: orderLineImage(product, { flavors }) || product.image };
    }
    return { unitPrice: product.price, quantity: qty, lineTotal: product.price * qty, heroImg: product.image };
  }, [product, hasSize, sizeName, qty, flavors]);

  if (!open || !product) return null;

  const incFlavor = (fl: string) => { if (!hasSize || pickedTotal < flavorCap) setFlavors((a) => [...a, fl]); };
  const decFlavor = (fl: string) => setFlavors((a) => { const i = a.indexOf(fl); if (i < 0) return a; const n = [...a]; n.splice(i, 1); return n; });

  const confirm = () => {
    const cfg: CustomizeConfig = hasSize
      ? { sizeCounts: [{ name: sizeName, qty }], size: sizeName, flavors: flavors.length ? flavors : undefined, quantity, unitPrice, image: heroImg }
      : { flavors: flavors.length ? flavors : undefined, quantity, unitPrice, image: heroImg };
    onConfirm(cfg);
    onClose();
  };

  const tree = (
    <Box layoutClassName="fixed inset-0 z-[110] flex items-end justify-center sm:items-center" backgroundClassName="bg-slate-900/60" onClick={onClose}>
      <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" roundedClassName="rounded-t-2xl sm:rounded-2xl" layoutClassName="flex max-h-[92vh] w-full max-w-lg flex-col sm:my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <Box layoutClassName="flex items-center justify-between gap-3 border-b px-4 py-3" borderClassName="border-slate-200 dark:border-slate-700">
          <Typography size="sm" layoutClassName="min-w-0 flex-1 truncate font-semibold">{product.name}</Typography>
          <Button type="button" aria-label="Đóng" onClick={onClose} variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-0" shadowClassName="shadow-none" borderClassName="border-transparent" layoutClassName="flex h-9 w-9 items-center justify-center rounded-full" textClassName="text-slate-500 dark:text-slate-300" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </Button>
        </Box>

        {/* Body */}
        <Box layoutClassName="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          {/* Hero image */}
          <Box layoutClassName="mx-auto h-40 w-40 overflow-hidden" roundedClassName="rounded-2xl" borderClassName="border border-slate-200 dark:border-slate-700">
            <Image src={heroImg} alt={product.name} layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-800" />
          </Box>

          {/* Size (radio) */}
          {hasSize ? (
            <Box layoutClassName="space-y-1.5">
              <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" variant="muted">Loại</Typography>
              <Box layoutClassName="flex flex-col gap-1.5">
                {sizes.map((sz) => {
                  const active = sizeName === sz.name;
                  const cnt = sz.count ?? 1;
                  return (
                    <Button key={sz.name} type="button" onClick={() => { setSizeName(sz.name); setFlavors([]); }} variant="ghost" disableVariantHover disableVariantTextColor
                      layoutClassName="flex items-center gap-2.5 px-3 py-2" roundedClassName="rounded-xl" sizeClassName="text-sm"
                      borderClassName={active ? 'border-2 border-primary-500' : 'border border-slate-200 dark:border-slate-600'}
                      backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-slate-800'}>
                      {sz.image ? (
                        <Box layoutClassName="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                          <Image src={sz.image} alt="" layoutClassName="h-full w-full object-cover" />
                        </Box>
                      ) : null}
                      <Box layoutClassName="min-w-0 flex-1 text-left">
                        <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{sz.name}{cnt > 1 ? ` (${cnt} cái)` : ''}</Typography>
                        <Typography as="p" size="xs" textClassName="text-primary-600 dark:text-primary-400">{formatVNDOrDash(sz.price)}</Typography>
                      </Box>
                      {active ? <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" /> : null}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          ) : null}

          {/* Vị (stepper) */}
          {hasFlavor ? (
            <Box layoutClassName="space-y-1.5">
              <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" variant="muted">
                Vị{hasSize ? ` (${pickedTotal}/${Number.isFinite(flavorCap) ? flavorCap : '∞'})` : (pickedTotal ? ` (${pickedTotal})` : '')}
              </Typography>
              <Box layoutClassName="grid grid-cols-2 gap-1.5">
                {flavorVars.map((v) => {
                  const fl = v.name;
                  const n = flavors.filter((x) => x === fl).length;
                  const cc = product ? flavorVariantColor(product, fl) : '#64748b';
                  const th = product ? flavorImage(product, fl) : undefined;
                  return (
                    <Box key={fl} layoutClassName="flex items-center gap-1.5 px-2 py-1.5" roundedClassName="rounded-xl" borderClassName="border" backgroundClassName="bg-white dark:bg-slate-800" style={{ borderColor: n ? cc : cc + '66' }}>
                      {th ? (
                        <Box layoutClassName="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                          <Image src={th} alt="" layoutClassName="h-full w-full object-cover" />
                        </Box>
                      ) : (
                        <Box layoutClassName="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cc }} />
                      )}
                      <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{fl}</Typography>
                      <Button type="button" onClick={() => decFlavor(fl)} disabled={n === 0} aria-label="Bớt" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-0.5" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Typography as="span" size="xs" layoutClassName="w-3 text-center font-semibold" textClassName="text-slate-800 dark:text-slate-100">{n}</Typography>
                      <Button type="button" onClick={() => incFlavor(fl)} disabled={hasSize && pickedTotal >= flavorCap} aria-label="Thêm" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-0.5" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : null}

          {/* Số lượng (chỉ khi có size hoặc SP thường; SP tính giá theo vị thì SL = số vị) */}
          {!(hasFlavor && !hasSize) ? (
            <Box layoutClassName="flex items-center justify-between">
              <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">Số lượng</Typography>
              <Box layoutClassName="flex items-center gap-3">
                <Button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Bớt" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-600 dark:text-slate-300" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Minus className="h-4 w-4" />
                </Button>
                <Typography as="span" size="sm" layoutClassName="w-6 text-center font-bold" textClassName="text-slate-900 dark:text-white">{qty}</Typography>
                <Button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Thêm" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-full" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-600 dark:text-slate-300" hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </Box>
            </Box>
          ) : null}
        </Box>

        {/* Footer */}
        <Box layoutClassName="border-t px-4 py-3" borderClassName="border-slate-200 dark:border-slate-700" backgroundClassName="bg-white dark:bg-slate-900">
          <Button type="button" variant="primary" fullWidth onClick={confirm} disableVariantHover
            layoutClassName="flex items-center justify-center gap-2 py-3" roundedClassName="rounded-xl">
            <Check className="h-4 w-4" />
            <Typography as="span" size="sm" layoutClassName="font-semibold">{editing ? 'Cập nhật' : 'Thêm vào đơn'}</Typography>
            <Typography as="span" size="sm" layoutClassName="font-bold">· {formatVNDOrDash(lineTotal)}</Typography>
          </Button>
        </Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

export default ProductCustomizeModal;
