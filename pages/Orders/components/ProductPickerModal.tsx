import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { Product } from '@/types';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';

export interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  /** Map productId → quantity hiện tại trong order. Hiển thị ×N badge + nút - khi >0. */
  currentQuantities?: Record<string, number>;
  /** Add 1 unit của product (POS-style: nếu đã có → +1 quantity, else add line mới). */
  onPickProduct: (product: Product) => void;
  /** Giảm 1 unit. Quantity về 0 → cha xoá item. */
  onDecrementProduct?: (productId: string) => void;
  /** Tạo item tuỳ chỉnh với name = query đang gõ. */
  onPickCustom?: (name: string) => void;
}

const CATEGORY_ALL = '__all__';

const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  open,
  onClose,
  products,
  currentQuantities = {},
  onPickProduct,
  onDecrementProduct,
  onPickCustom,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORY_ALL);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Esc đóng modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll khi mở
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus search khi mở
  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset state khi đóng
  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveCategory(CATEGORY_ALL);
    }
  }, [open]);

  // Trích categories duy nhất
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products theo search + category
  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    return products.filter((p) => {
      if (activeCategory !== CATEGORY_ALL && p.category !== activeCategory) return false;
      if (!q) return true;
      const nName = normalizeSearchText(p.name);
      const nCat = normalizeSearchText(p.category);
      const nTags = (p.tags ?? []).map((t) => normalizeSearchText(t)).join(' ');
      return nName.includes(q) || nCat.includes(q) || nTags.includes(q);
    });
  }, [query, activeCategory, products]);

  // Sort: most-recently-in-order first → others
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const qA = currentQuantities[a.id] ?? 0;
      const qB = currentQuantities[b.id] ?? 0;
      if (qA !== qB) return qB - qA;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [filtered, currentQuantities]);

  // Cart summary
  const cartSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    Object.keys(currentQuantities).forEach((id) => {
      const qty = Number(currentQuantities[id] || 0);
      if (qty <= 0) return;
      count += qty;
      const p = products.find((pp) => pp.id === id);
      if (p) total += (p.price || 0) * qty;
    });
    return { count, total };
  }, [currentQuantities, products]);

  const showCreateRow =
    !!onPickCustom &&
    query.trim().length > 0 &&
    !filtered.some((p) => normalizeSearchText(p.name) === normalizeSearchText(query));

  if (!open) return null;

  const tree = (
    <Box
      layoutClassName="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      backgroundClassName="bg-slate-900/60"
      onClick={onClose}
    >
      <Card
        padding="none"
        borderClassName="border-slate-200 dark:border-slate-700"
        roundedClassName="rounded-t-2xl sm:rounded-2xl"
        layoutClassName="flex h-[90vh] w-full max-w-4xl flex-col sm:h-[85vh] sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          layoutClassName="flex items-center justify-between gap-3 border-b px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
        >
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Chọn sản phẩm
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm vào sản phẩm để thêm vào đơn — sản phẩm đã chọn hiển thị ×N
            </Typography>
          </Box>
          <Button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-5 w-5" />
          </Button>
        </Box>

        {/* Sticky filters */}
        <Box
          layoutClassName="space-y-2 border-b px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Box layoutClassName="relative">
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm sản phẩm theo tên / tag / danh mục..."
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
            {query ? (
              <Button
                type="button"
                aria-label="Xoá tìm kiếm"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </Box>

          {categories.length > 0 ? (
            <Box layoutClassName="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              <CategoryChip
                label="Tất cả"
                active={activeCategory === CATEGORY_ALL}
                onClick={() => setActiveCategory(CATEGORY_ALL)}
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c}
                  label={c}
                  active={activeCategory === c}
                  onClick={() => setActiveCategory(c)}
                />
              ))}
            </Box>
          ) : null}
        </Box>

        {/* Grid body */}
        <Box layoutClassName="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {sorted.length === 0 && !showCreateRow ? (
            <Box layoutClassName="flex h-full flex-col items-center justify-center gap-2 p-6">
              <Typography size="sm" variant="muted">
                {query
                  ? `Không tìm thấy sản phẩm khớp "${query}"`
                  : 'Không có sản phẩm nào trong danh mục này.'}
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
              {sorted.map((p) => {
                const qty = currentQuantities[p.id] ?? 0;
                const isInOrder = qty > 0;
                return (
                  <Box
                    key={p.id}
                    layoutClassName="group relative overflow-hidden rounded-xl border transition-all"
                    borderClassName={
                      isInOrder
                        ? 'border-primary-300 dark:border-primary-700'
                        : 'border-slate-200 dark:border-slate-700'
                    }
                    backgroundClassName={
                      isInOrder
                        ? 'bg-primary-50/40 dark:bg-primary-950/30'
                        : 'bg-white dark:bg-slate-800'
                    }
                  >
                    {/* Click whole card → +1 */}
                    <Button
                      type="button"
                      onClick={() => onPickProduct(p)}
                      className="block w-full text-left"
                     variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                      {/* Thumbnail */}
                      <Box layoutClassName="relative aspect-square w-full overflow-hidden">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <Box
                            layoutClassName="flex h-full w-full items-center justify-center text-lg font-bold uppercase"
                            backgroundClassName="bg-slate-100 dark:bg-slate-700"
                            textClassName="text-slate-400 dark:text-slate-500"
                          >
                            {p.name.slice(0, 2)}
                          </Box>
                        )}
                        {isInOrder ? (
                          <Box
                            layoutClassName="absolute right-1.5 top-1.5 flex h-6 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-md"
                            backgroundClassName="bg-primary-500"
                            textClassName="text-white"
                          >
                            ×{qty}
                          </Box>
                        ) : null}
                      </Box>

                      {/* Name + price */}
                      <Box layoutClassName="p-2">
                        <Typography
                          size="xs"
                          layoutClassName="line-clamp-2 min-h-[2.4em] font-semibold"
                        >
                          {p.name}
                        </Typography>
                        <Typography
                          size="sm"
                          layoutClassName="mt-0.5 font-bold"
                          textClassName="text-primary-600 dark:text-primary-400"
                        >
                          {formatVNDOrDash(p.price)}
                        </Typography>
                      </Box>
                    </Button>

                    {/* Stepper khi đã có trong order */}
                    {isInOrder && onDecrementProduct ? (
                      <Box layoutClassName="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-md dark:bg-slate-800">
                        <Button
                          type="button"
                          aria-label="Giảm 1"
                          onClick={() => onDecrementProduct(p.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          aria-label="Thêm 1"
                          onClick={() => onPickProduct(p)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-primary-600 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/40"
                         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Tạo item tuỳ chỉnh khi search không match */}
          {showCreateRow ? (
            <Box layoutClassName="mt-3 flex justify-center">
              <Button
                type="button"
                onClick={() => {
                  if (onPickCustom) onPickCustom(query.trim());
                  setQuery('');
                }}
                className="rounded-lg border border-dashed border-primary-300 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950/30"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                + Tạo item tuỳ chỉnh: <strong>{query.trim()}</strong>
              </Button>
            </Box>
          ) : null}
        </Box>

        {/* Sticky footer — cart summary + done */}
        <Box
          layoutClassName="flex items-center justify-between gap-3 border-t px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Box layoutClassName="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-primary-500" />
            {cartSummary.count > 0 ? (
              <>
                <Typography size="sm" layoutClassName="font-semibold">
                  {cartSummary.count} món
                </Typography>
                <Typography size="sm" textClassName="text-primary-600 dark:text-primary-400">
                  {formatVNDOrDash(cartSummary.total)}
                </Typography>
              </>
            ) : (
              <Typography size="sm" variant="muted">
                Chưa chọn sản phẩm nào
              </Typography>
            )}
          </Box>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            leftIcon={<Check />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            Xong
          </Button>
        </Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

const CategoryChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <Button
    type="button"
    onClick={onClick}
    className={
      'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
      (active
        ? 'border-primary-300 bg-primary-100 text-primary-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
    }
   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
    {label}
  </Button>
);

export default ProductPickerModal;
