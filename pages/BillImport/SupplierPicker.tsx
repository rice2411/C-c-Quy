import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Sparkles, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
import { normalizeSearchText } from '@/utils/format/stringUtil';

const MAX_RESULTS = 8;
const moneyFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export interface SupplierPickerProps {
  rawName: string;
  selectedId: string | null;
  suppliers: ImportedSupplierSummary[];
  onChange: (next: {
    id: string | null;
    name: string;
    supplier?: ImportedSupplierSummary;
  }) => void;
}

const SupplierPicker: React.FC<SupplierPickerProps> = ({
  rawName,
  selectedId,
  suppliers,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedId) ?? null,
    [suppliers, selectedId],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearchText(rawName);
    // Khi đã có selection và user CHƯA gõ gì khác (rawName vẫn = tên NCC đã chọn),
    // hiển thị TOÀN BỘ danh sách để user dễ chuyển sang NCC khác mà
    // không phải xoá chip trước.
    const showAll =
      !q ||
      (selectedSupplier && normalizeSearchText(selectedSupplier.name) === q);
    if (showAll) {
      const others = suppliers.filter((s) => s.id !== selectedId);
      const selectedFirst = selectedSupplier ? [selectedSupplier, ...others] : others;
      return selectedFirst.slice(0, MAX_RESULTS);
    }
    const scored = suppliers
      .map((s) => {
        const nName = normalizeSearchText(s.name);
        const nNorm = normalizeSearchText(s.normalizedName);
        let score = 0;
        if (nName === q || nNorm === q) score = 1000;
        else if (nName.startsWith(q) || nNorm.startsWith(q)) score = 500;
        else if (nName.includes(q) || nNorm.includes(q)) score = 200;
        else return null;
        return { s, score };
      })
      .filter((x): x is { s: ImportedSupplierSummary; score: number } => Boolean(x))
      .sort((a, b) => b.score - a.score || (b.s.receiptCount - a.s.receiptCount));
    return scored.slice(0, MAX_RESULTS).map((x) => x.s);
  }, [rawName, suppliers, selectedSupplier, selectedId]);

  const handlePickExisting = (s: ImportedSupplierSummary) => {
    onChange({ id: s.id, name: s.name, supplier: s });
    setOpen(false);
  };

  const handleCreateNew = () => {
    onChange({ id: null, name: rawName });
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ id: null, name: rawName });
  };

  const showCreateRow =
    rawName.trim().length > 0 &&
    !filtered.some(
      (s) =>
        normalizeSearchText(s.name) === normalizeSearchText(rawName) ||
        normalizeSearchText(s.normalizedName) === normalizeSearchText(rawName),
    );

  return (
    <Box layoutClassName="relative" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Box layoutClassName="relative min-w-0 flex-1">
          <Input
            value={rawName}
            onChange={(e) => {
              const next = e.target.value;
              // Nếu user gõ khác đi → tự bỏ chọn, vì có khả năng đang tìm NCC khác.
              const stillMatchesSelected =
                selectedSupplier &&
                normalizeSearchText(selectedSupplier.name) === normalizeSearchText(next);
              onChange({
                id: stillMatchesSelected ? selectedId : null,
                name: next,
                supplier: stillMatchesSelected ? selectedSupplier : undefined,
              });
              setOpen(true);
            }}
            onFocus={(e) => {
              setOpen(true);
              // Khi đã có selection, focus → highlight text để gõ đè dễ.
              if (selectedSupplier) e.currentTarget.select();
            }}
            placeholder="Tên NCC — gõ để tìm, hoặc bấm vào ô để chọn lại"
          />
          <Button
            type="button"
            aria-label="Mở danh sách NCC"
            onClick={() => setOpen((v) => !v)}
            className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </Box>
        {selectedSupplier ? (
          <Box
            layoutClassName="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
            borderClassName="border-emerald-300 dark:border-emerald-700"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
            textClassName="text-emerald-800 dark:text-emerald-200"
          >
            <Check className="h-3 w-3" />
            <span className="font-medium">Đã chọn: {selectedSupplier.name}</span>
            <Button
              type="button"
              onClick={handleClear}
              aria-label="Bỏ chọn NCC"
              className="ml-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
              <X className="h-3 w-3" />
            </Button>
          </Box>
        ) : (
          <Box
            layoutClassName="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
            borderClassName="border-amber-300 dark:border-amber-700"
            backgroundClassName="bg-amber-50 dark:bg-amber-950/40"
            textClassName="text-amber-800 dark:text-amber-200"
          >
            <Plus className="h-3 w-3" />
            <span className="font-medium">Sẽ tạo NCC mới</span>
          </Box>
        )}
      </Box>

      {open && (filtered.length > 0 || showCreateRow) ? (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {filtered.length > 0 ? (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((s, idx) => {
                const isCurrent = s.id === selectedId;
                const hasTypedQuery =
                  normalizeSearchText(rawName).length > 0 &&
                  !(selectedSupplier &&
                    normalizeSearchText(selectedSupplier.name) ===
                      normalizeSearchText(rawName));
                const isTopHint = !isCurrent && idx === 0 && hasTypedQuery;
                return (
                  <Button
                    type="button"
                    key={s.id}
                    onClick={() => handlePickExisting(s)}
                    className={
                      'flex w-full flex-col gap-1 px-3 py-2 text-left text-sm transition-colors ' +
                      (isCurrent
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40'
                        : 'hover:bg-orange-50 dark:hover:bg-orange-900/20')
                    }
                   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                    <Box layoutClassName="flex items-center justify-between gap-2">
                      <Box layoutClassName="flex min-w-0 items-center gap-2">
                        {isCurrent ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : isTopHint ? (
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        ) : null}
                        <span className="truncate font-medium text-slate-800 dark:text-slate-100">
                          {s.name}
                        </span>
                        {isCurrent ? (
                          <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                            đang chọn
                          </span>
                        ) : null}
                      </Box>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {s.receiptCount}p · {moneyFmt.format(s.totalAmount)}đ
                      </span>
                    </Box>
                    <Box layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {s.phone ? <span>📞 {s.phone}</span> : null}
                      {s.address ? <span className="truncate">📍 {s.address}</span> : null}
                      {s.category ? <span>🏷️ {s.category}</span> : null}
                      {s.lastReceiptDate ? (
                        <span>Lần cuối: {s.lastReceiptDate.slice(0, 10)}</span>
                      ) : null}
                    </Box>
                  </Button>
                );
              })}
            </Box>
          ) : null}
          {showCreateRow ? (
            <Button
              type="button"
              onClick={handleCreateNew}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 dark:border-slate-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
              <Plus className="h-4 w-4" />
              <span>
                Tạo NCC mới: <strong>{rawName.trim()}</strong>
              </span>
            </Button>
          ) : null}
        </Box>
      ) : null}

      {selectedSupplier ? (
        <Box
          layoutClassName="mt-2 flex flex-wrap items-center gap-3 rounded-lg p-2 text-xs"
          backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
          borderClassName="border border-slate-200 dark:border-slate-700"
        >
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Phiếu của NCC này:
          </Typography>
          <Typography size="xs" layoutClassName="font-semibold">
            {selectedSupplier.receiptCount} phiếu
          </Typography>
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">·</Typography>
          <Typography size="xs" layoutClassName="font-semibold">
            {moneyFmt.format(selectedSupplier.totalAmount)}đ
          </Typography>
          {selectedSupplier.lastReceiptDate ? (
            <>
              <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">·</Typography>
              <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
                lần cuối {selectedSupplier.lastReceiptDate.slice(0, 10)}
              </Typography>
            </>
          ) : null}
        </Box>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        layoutClassName="hidden"
        disableVariantHover
        disableVariantTextColor
      >
        open
      </Button>
    </Box>
  );
};

export default SupplierPicker;
