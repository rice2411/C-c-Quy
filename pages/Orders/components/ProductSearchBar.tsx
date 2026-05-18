import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckSquare, Search, Sparkles, Square, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import type { Product } from '@/types';
import { normalizeSearchText } from '@/utils/stringUtil';
import { formatVNDOrDash } from '@/utils/currencyUtil';
import { getTagPalette } from '@/utils/productTagPalette';

const MAX_RESULTS = 12;

export interface ProductSearchBarProps {
  products: Product[];
  /** Được gọi cho TỪNG product khi user bấm "Thêm". */
  onPickProduct: (product: Product) => void;
  onPickCustom?: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  products,
  onPickProduct,
  onPickCustom,
  placeholder = 'Tìm sản phẩm để thêm vào đơn — gõ tên / tag / danh mục...',
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
          placeholder={placeholder}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
        />
        {query ? (
          <button
            type="button"
            aria-label="Xoá tìm kiếm"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </Box>

      {open && (filtered.length > 0 || showCreateRow) ? (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-[420px] overflow-hidden rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {/* Sticky top — meta + chọn tất */}
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
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Bỏ chọn
                    </button>
                  </>
                ) : null}
              </Box>
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Chọn tất ({filtered.length})
              </button>
            </Box>
          ) : null}

          {/* List rows — click toàn row để toggle chọn */}
          <Box layoutClassName="max-h-[300px] overflow-auto">
            {filtered.length === 0 ? (
              <Typography size="xs" variant="muted" layoutClassName="p-3 text-center">
                Không tìm thấy sản phẩm khớp "{query}"
              </Typography>
            ) : (
              <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((p, idx) => {
                  const isSelected = selectedIds.has(p.id);
                  const isTopHint =
                    !isSelected && idx === 0 && normalizeSearchText(query).length > 0;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ' +
                        (isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : 'hover:bg-orange-50 dark:hover:bg-orange-900/20')
                      }
                    >
                      {/* Checkbox indicator (chỉ visual, không phải target click riêng) */}
                      <Box layoutClassName="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </Box>

                      {/* Thumbnail */}
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

                      {/* Name + meta */}
                      <Box layoutClassName="min-w-0 flex-1">
                        <Box layoutClassName="flex items-center gap-2">
                          {isTopHint && (
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                          )}
                          <span className="truncate font-medium text-slate-800 dark:text-slate-100">
                            {p.name}
                          </span>
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

                      {/* Price */}
                      <span className="shrink-0 text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatVNDOrDash(p.price)}
                      </span>
                    </button>
                  );
                })}
              </Box>
            )}
            {showCreateRow ? (
              <button
                type="button"
                onClick={handleCustom}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 dark:border-slate-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                <span>
                  + Tạo item tuỳ chỉnh: <strong>{query.trim()}</strong>
                </span>
              </button>
            ) : null}
          </Box>

          {/* Sticky bottom — bulk add CTA */}
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
                disableVariantTextColor
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
