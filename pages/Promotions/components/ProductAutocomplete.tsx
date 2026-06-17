import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import type { Product } from '@/types';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatVND } from '@/utils/format/currencyUtil';

const MAX_RESULTS = 10;

export interface ProductAutocompleteProps {
  products: Product[];
  /** Danh sách productId đã chọn. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** false = chỉ chọn 1 (vd sản phẩm tặng). */
  multiple?: boolean;
  placeholder?: string;
}

/** Ô tìm + chọn sản phẩm (autocomplete), hiển thị đã chọn dạng chip. */
const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  products,
  value,
  onChange,
  multiple = true,
  placeholder = 'Tìm sản phẩm theo tên…',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selectedIds = useMemo(() => new Set(value), [value]);
  const selected = useMemo(
    () => value.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p),
    [value, products],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    const base = products.filter((p) => !selectedIds.has(p.id));
    if (!q) return base.slice(0, MAX_RESULTS);
    return base
      .filter(
        (p) =>
          normalizeSearchText(p.name).includes(q) ||
          normalizeSearchText(p.category).includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [query, products, selectedIds]);

  const pick = (p: Product) => {
    onChange(multiple ? (selectedIds.has(p.id) ? value : [...value, p.id]) : [p.id]);
    setQuery('');
    setOpen(false);
  };
  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  const showInput = multiple || selected.length === 0;

  return (
    <Box layoutClassName="relative" ref={wrapRef as React.RefObject<HTMLDivElement>}>
      {selected.length > 0 && (
        <Box layoutClassName="mb-1.5 flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge
              key={p.id}
              size="sm"
              borderClassName="border-transparent"
              backgroundClassName="bg-primary-100 dark:bg-primary-900/30"
              textClassName="text-primary-700 dark:text-primary-300"
            >
              {p.name}
              <Button
                type="button"
                variant="ghost"
                aria-label={`Bỏ ${p.name}`}
                onClick={() => remove(p.id)}
                disableVariantHover
                disableVariantTextColor
                borderClassName="border-transparent"
                sizeClassName="p-0"
                textClassName="text-primary-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </Box>
      )}

      {showInput && (
        <Input
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
      )}

      {open && showInput && filtered.length > 0 && (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {filtered.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => pick(p)}
              disableVariantHover
              disableVariantTextColor
              borderClassName="border-transparent"
              backgroundClassName="bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20"
              sizeClassName="px-3 py-2"
              layoutClassName="flex w-full items-center justify-between gap-2 text-left"
              textClassName="text-slate-700 dark:text-slate-200"
            >
              <Typography as="span" size="sm" layoutClassName="truncate">{p.name}</Typography>
              <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-primary-600 dark:text-primary-400">
                {formatVND(p.price)}
              </Typography>
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProductAutocomplete;
