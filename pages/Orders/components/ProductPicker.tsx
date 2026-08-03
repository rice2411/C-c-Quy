import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Sparkles, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import type { Product } from '@/types';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import { getTagPalette } from '@/utils/product/productTagPalette';

import Button from '@/components/ui/Button';
const MAX_RESULTS = 12;

export interface ProductPickerProps {
  /** id sản phẩm đang chọn (rỗng = chưa chọn / custom item). */
  selectedId: string;
  /** Tên hiển thị hiện tại (cho custom item khi selectedId rỗng). */
  selectedName: string;
  products: Product[];
  /** Khi user chọn 1 sản phẩm có sẵn. */
  onPick: (product: Product) => void;
  /** Khi user chọn "Tạo item tuỳ chỉnh" với tên đã gõ. */
  onPickCustom?: (customName: string) => void;
  /** Khi user xoá chip để chọn lại — về trạng thái chưa chọn. */
  onClear?: () => void;
  placeholder?: string;
}

const ProductPicker: React.FC<ProductPickerProps> = ({
  selectedId,
  selectedName,
  products,
  onPick,
  onPickCustom,
  onClear,
  placeholder = 'Tìm sản phẩm theo tên / tag / danh mục...',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => (selectedId ? products.find((p) => p.id === selectedId) ?? null : null),
    [products, selectedId],
  );

  // Đóng khi click ngoài
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

  const handlePick = (p: Product) => {
    onPick(p);
    setQuery('');
    setOpen(false);
  };

  const handleCustom = () => {
    if (!onPickCustom) return;
    onPickCustom(query.trim());
    setQuery('');
    setOpen(false);
  };

  const handleClearSelection = () => {
    if (onClear) onClear();
    setQuery('');
    setOpen(true);
  };

  // ─── UI khi đã chọn — Card gọn ─────────────────────────────────────────
  if (selected) {
    return (
      <Box layoutClassName="relative" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
        <Box
          layoutClassName="flex items-center gap-3 rounded-lg border p-2.5"
          borderClassName="border-emerald-200 dark:border-emerald-800"
          backgroundClassName="bg-emerald-50/60 dark:bg-emerald-950/30"
        >
          {selected.image ? (
            <img
              src={selected.image}
              alt={selected.name}
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <Box
              layoutClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase"
              backgroundClassName="bg-emerald-100 dark:bg-emerald-900/60"
              textClassName="text-emerald-700 dark:text-emerald-300"
            >
              {selected.name.slice(0, 2)}
            </Box>
          )}
          <Box layoutClassName="min-w-0 flex-1">
            <Box layoutClassName="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <Typography size="sm" layoutClassName="truncate font-semibold">
                {selected.name}
              </Typography>
            </Box>
            <Box layoutClassName="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <Typography size="xs" textClassName="font-medium text-emerald-700 dark:text-emerald-300">
                {formatVNDOrDash(selected.price)}
              </Typography>
              {selected.category ? (
                <Typography size="xs" variant="muted">
                  · {selected.category}
                </Typography>
              ) : null}
              {selected.tags && selected.tags.length > 0 ? (
                <Box layoutClassName="flex flex-wrap gap-1">
                  {selected.tags.slice(0, 3).map((tag, ti) => {
                    const palette = getTagPalette(tag);
                    return (
                      <Badge key={ti} className={palette.chip} layoutClassName="px-1.5 py-0">
                        {tag}
                      </Badge>
                    );
                  })}
                </Box>
              ) : null}
            </Box>
          </Box>
          <Button
            type="button"
            onClick={handleClearSelection}
            aria-label="Đổi sản phẩm khác"
            className="rounded-md p-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            Đổi
          </Button>
        </Box>
      </Box>
    );
  }

  // ─── UI khi chưa chọn — Search + dropdown ──────────────────────────────
  return (
    <Box layoutClassName="relative" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Box layoutClassName="relative">
        <Input
          value={query || selectedName || ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
        />
        <Button
          type="button"
          aria-label="Mở danh sách sản phẩm"
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
          <ChevronDown className="h-4 w-4" />
        </Button>
        {(query || selectedName) && (
          <Button
            type="button"
            aria-label="Xoá tìm kiếm"
            onClick={() => {
              setQuery('');
              if (selectedName && onClear) onClear();
            }}
            className="absolute inset-y-0 right-8 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </Box>

      {open && (filtered.length > 0 || showCreateRow) ? (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-auto rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {filtered.length > 0 ? (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((p, idx) => {
                const isTopHint = idx === 0 && normalizeSearchText(query).length > 0;
                return (
                  <Button
                    type="button"
                    key={p.id}
                    onClick={() => handlePick(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20"
                   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
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
                );
              })}
            </Box>
          ) : null}
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
      ) : null}
    </Box>
  );
};

export default ProductPicker;
