import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckSquare, Minus, Plus, Search, Sparkles, Square, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import type { Product } from '@/types';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import { getTagPalette } from '@/utils/product/productTagPalette';

const MAX_RESULTS = 12;

export interface ProductSearchBarProps {
  products: Product[];
  onPickProduct: (product: Product) => void;
  /** Optional — gọi khi user bấm "-" trên row mà product đang có trong order. */
  onDecrementProduct?: (productId: string) => void;
  onPickCustom?: (name: string) => void;
  /** Map productId → quantity hiện tại trong order. Dùng để hiển thị ×N badge. */
  currentQuantities?: Record<string, number>;
  placeholder?: string;
  autoFocus?: boolean;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  products,
  onPickProduct,
  onDecrementProduct,
  onPickCustom,
  currentQuantities,
  placeholder = 'Tìm sản phẩm — Enter để thêm nhanh',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return products.slice(0, MAX_RESULTS);
    const scored = products
      .map((p) => {
        const nName = normalizeSearchText(p.name);
        const nCat = normalizeSearchText(p.category);
        const nTags = (p.tags ?? []).map((t) => normalizeSearchText(t)).join(' ');
        let score = 0;
        if (nName === q) score = 1000;
        else if (nName.startsWith(q)) score = 600;
        else if (nName.includes(q)) score = 300;
        else if (nTags.includes(q)) score = 150;
        else if (nCat.includes(q)) score = 80;
        else return null;
        return { p, score };
      })
      .filter((x): x is { p: Product; score: number } => Boolean(x))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map((x) => x.p);
  }, [query, products]);

  const showCreateRow =
    !!onPickCustom &&
    query.trim().length > 0 &&
    !filtered.some((p) => normalizeSearchText(p.name) === normalizeSearchText(query));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const p = products.find((pp) => pp.id === id);
      if (p) onPickProduct(p);
    });
    clearSelection();
    setQuery('');
    setOpen(false);
  };

  const handleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleCustom = () => {
    if (!onPickCustom) return;
    onPickCustom(query.trim());
    setQuery('');
    inputRef.current?.focus();
  };

  /**
   * Enter behaviour:
   *  - Có selection → add all đã chọn.
   *  - Có query + có top result → add top result, clear search.
   *  - Có query + không match + showCreateRow → tạo custom item.
   *  - Không có gì → no-op.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIds.size > 0) {
        handleAddSelected();
        return;
      }
      if (filtered.length > 0) {
        const top = filtered[0];
        onPickProduct(top);
        setQuery('');
        inputRef.current?.focus();
        return;
      }
      if (showCreateRow) {
        handleCustom();
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  return (
    <Box layoutClassName="relative" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Box layoutClassName="relative">
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
        />
        {query ? (
          <Button
            type="button"
            aria-label="Xoá tìm kiếm"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </Box>

      {open && (filtered.length > 0 || showCreateRow) ? (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-[420px] overflow-hidden rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {filtered.length > 0 ? (
            <Box
              layoutClassName="sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-3 py-1.5 text-xs"
              borderClassName="border-slate-100 dark:border-slate-700"
              backgroundClassName="bg-slate-50/95 dark:bg-slate-900/95"
            >
              <Box layoutClassName="flex items-center gap-2">
                {selectedIds.size > 0 ? (
                  <>
                    <Typography size="xs" layoutClassName="font-semibold text-emerald-700 dark:text-emerald-300">
                      Đã chọn {selectedIds.size}
                    </Typography>
                    <Button
                      type="button"
                      onClick={clearSelection}
                      className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                     variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                      Bỏ chọn
                    </Button>
                  </>
                ) : null}
              </Box>
              <Button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                Chọn tất ({filtered.length})
              </Button>
            </Box>
          ) : null}

          <Box layoutClassName="max-h-[300px] overflow-auto">
            {filtered.length === 0 ? (
              <Typography size="xs" variant="muted" layoutClassName="p-3 text-center">
                Không tìm thấy sản phẩm khớp "{query}"
              </Typography>
            ) : (
              <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((p, idx) => {
                  const isSelected = selectedIds.has(p.id);
                  const currentQty = currentQuantities?.[p.id] ?? 0;
                  const isTopHint =
                    !isSelected && idx === 0 && normalizeSearchText(query).length > 0;
                  return (
                    <Box
                      key={p.id}
                      layoutClassName={
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ' +
                        (isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : 'hover:bg-primary-50/60 dark:hover:bg-primary-900/20')
                      }
                    >
                      {/* Click vùng này = toggle multi-select */}
                      <Button
                        type="button"
                        onClick={() => toggle(p.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                       variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                        <Box layoutClassName="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </Box>

                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <Box
                            layoutClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold uppercase"
                            backgroundClassName="bg-slate-100 dark:bg-slate-700"
                            textClassName="text-slate-500 dark:text-slate-400"
                          >
                            {p.name.slice(0, 2)}
                          </Box>
                        )}

                        <Box layoutClassName="min-w-0 flex-1">
                          <Box layoutClassName="flex items-center gap-2">
                            {isTopHint && (
                              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                            )}
                            <span className="truncate font-medium text-slate-800 dark:text-slate-100">
                              {p.name}
                            </span>
                            {currentQty > 0 ? (
                              <span className="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-900/60 dark:text-primary-200">
                                ×{currentQty}
                              </span>
                            ) : null}
                          </Box>
                          <Box layoutClassName="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {p.category ? <span>{p.category}</span> : null}
                            {p.tags && p.tags.length > 0 ? (
                              <Box layoutClassName="flex flex-wrap gap-1">
                                {p.tags.slice(0, 2).map((tag, ti) => {
                                  const palette = getTagPalette(tag);
                                  return (
                                    <Badge
                                      key={`${p.id}-tag-${ti}`}
                                      className={palette.chip}
                                      layoutClassName="px-1.5 py-0 text-[10px]"
                                    >
                                      {tag}
                                    </Badge>
                                  );
                                })}
                              </Box>
                            ) : null}
                          </Box>
                        </Box>

                        <span className="shrink-0 text-sm font-semibold text-primary-600 dark:text-primary-400">
                          {formatVNDOrDash(p.price)}
                        </span>
                      </Button>

                      {/* Stepper +/− — independent click target */}
                      <Box layoutClassName="flex shrink-0 items-center gap-0.5">
                        {currentQty > 0 && onDecrementProduct ? (
                          <Button
                            type="button"
                            aria-label={`Giảm 1 ${p.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDecrementProduct(p.id);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          aria-label={`Thêm 1 ${p.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPickProduct(p);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-primary-600 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/40"
                         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            {showCreateRow ? (
              <Button
                type="button"
                onClick={handleCustom}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 dark:border-slate-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <span>
                  + Tạo item tuỳ chỉnh: <strong>{query.trim()}</strong>
                </span>
              </Button>
            ) : null}
          </Box>

          {selectedIds.size > 0 ? (
            <Box
              layoutClassName="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t px-3 py-2"
              borderClassName="border-slate-100 dark:border-slate-700"
              backgroundClassName="bg-white/95 dark:bg-slate-800/95"
            >
              <Button
                type="button"
                variant="primary"
                onClick={handleAddSelected}
                leftIcon={<Check />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-3 py-1.5 text-xs"
                layoutClassName="inline-flex items-center gap-1.5"
                disableVariantHover
              >
                Thêm {selectedIds.size} sản phẩm
              </Button>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

export default ProductSearchBar;
