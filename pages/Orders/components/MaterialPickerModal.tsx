import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Minus, Package, Plus, Search, Sparkles, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { MaterialPriceOption } from '@/services/stockReceiptService';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatVND } from '@/utils/format/currencyUtil';

export interface MaterialPickerModalProps {
  open: boolean;
  onClose: () => void;
  materials: MaterialPriceOption[];
  /** Map materialId → quantity hiện tại trong đơn (hiển thị ×N + nút -). */
  currentQuantities?: Record<string, number>;
  /** Thêm 1 đơn vị nguyên liệu (nếu đã có → +1). */
  onPick: (material: MaterialPriceOption) => void;
  /** Giảm 1 đơn vị; về 0 → cha xoá. */
  onDecrement?: (materialId: string) => void;
}

const MaterialPickerModal: React.FC<MaterialPickerModalProps> = ({
  open,
  onClose,
  materials,
  currentQuantities = {},
  onPick,
  onDecrement,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    const list = q ? materials.filter((m) => normalizeSearchText(m.name).includes(q)) : materials;
    return [...list].sort((a, b) => {
      const qA = currentQuantities[a.id] ?? 0;
      const qB = currentQuantities[b.id] ?? 0;
      if (qA !== qB) return qB - qA;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [query, materials, currentQuantities]);

  const cartCount = useMemo(() => {
    let n = 0;
    for (const v of Object.values(currentQuantities)) n += Number(v) || 0;
    return n;
  }, [currentQuantities]);

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
        layoutClassName="flex h-[90vh] w-full max-w-2xl flex-col sm:h-[80vh] sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          layoutClassName="flex items-center justify-between gap-3 border-b px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
        >
          <Box>
            <Typography size="sm" layoutClassName="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-4 w-4 text-primary-500" /> Chọn nguyên liệu trang trí
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm để thêm — nguyên liệu đã chọn hiển thị ×N. Giá lấy theo giá nhập trung bình.
            </Typography>
          </Box>
          <Button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border-transparent"
            roundedClassName="rounded-full"
            sizeClassName="h-9 w-9"
            layoutClassName="flex items-center justify-center"
            textClassName="text-slate-500 dark:text-slate-300"
            hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </Box>

        {/* Search */}
        <Box
          layoutClassName="border-b px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nguyên liệu theo tên..."
            leftIcon={<Search />}
            leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          />
        </Box>

        {/* List */}
        <Box layoutClassName="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {filtered.length === 0 ? (
            materials.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="Chưa có nguyên liệu nào (nhập kho từ hoá đơn trước)."
                layoutClassName="!min-h-0"
              />
            ) : (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title={`Không tìm thấy nguyên liệu khớp "${query}"`}
                layoutClassName="!min-h-0"
              />
            )
          ) : (
            <Box layoutClassName="space-y-2">
              {filtered.map((m) => {
                const qty = currentQuantities[m.id] ?? 0;
                const isPicked = qty > 0;
                return (
                  <Box
                    key={m.id}
                    layoutClassName="flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
                    borderClassName={isPicked ? 'border-primary-300 dark:border-primary-700' : 'border-slate-200 dark:border-slate-700'}
                    backgroundClassName={isPicked ? 'bg-primary-50/40 dark:bg-primary-950/30' : 'bg-white dark:bg-slate-800'}
                  >
                    <Button
                      type="button"
                      onClick={() => onPick(m)}
                      variant="ghost"
                      disableVariantHover
                      disableVariantTextColor
                      borderClassName="border-transparent"
                      layoutClassName="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                      sizeClassName="p-0"
                    >
                      <Box layoutClassName="min-w-0">
                        <Typography size="sm" layoutClassName="truncate font-medium">{m.name}</Typography>
                        <Typography size="xs" textClassName="text-primary-600 dark:text-primary-400">{formatVND(m.unitPrice)}</Typography>
                      </Box>
                      {isPicked ? (
                        <Box
                          layoutClassName="flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                          backgroundClassName="bg-primary-500"
                          textClassName="text-white"
                        >
                          ×{qty}
                        </Box>
                      ) : null}
                    </Button>

                    {isPicked && onDecrement ? (
                      <Box layoutClassName="flex shrink-0 items-center gap-0.5 rounded-full bg-white p-0.5 shadow-sm dark:bg-slate-900">
                        <Button
                          type="button"
                          aria-label="Giảm 1"
                          onClick={() => onDecrement(m.id)}
                          variant="ghost"
                          disableVariantHover
                          disableVariantTextColor
                          borderClassName="border-transparent"
                          roundedClassName="rounded-full"
                          sizeClassName="h-6 w-6"
                          layoutClassName="flex items-center justify-center"
                          textClassName="text-slate-600 dark:text-slate-300"
                          hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          aria-label="Thêm 1"
                          onClick={() => onPick(m)}
                          variant="ghost"
                          disableVariantHover
                          disableVariantTextColor
                          borderClassName="border-transparent"
                          roundedClassName="rounded-full"
                          sizeClassName="h-6 w-6"
                          layoutClassName="flex items-center justify-center"
                          textClassName="text-primary-600 dark:text-primary-300"
                          hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        type="button"
                        aria-label="Thêm"
                        onClick={() => onPick(m)}
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        borderClassName="border-transparent"
                        roundedClassName="rounded-full"
                        sizeClassName="h-7 w-7"
                        layoutClassName="flex shrink-0 items-center justify-center"
                        backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                        textClassName="text-primary-600 dark:text-primary-300"
                        hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/40"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          layoutClassName="flex items-center justify-between gap-3 border-t px-4 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Typography size="sm" variant="muted">
            {cartCount > 0 ? `${cartCount} vật phẩm trang trí` : 'Chưa chọn vật phẩm nào'}
          </Typography>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            leftIcon={<Check />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
          >
            Xong
          </Button>
        </Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

export default MaterialPickerModal;
