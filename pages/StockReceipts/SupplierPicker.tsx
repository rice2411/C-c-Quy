import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Sparkles, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import { formatDateISO } from '@/utils/format/dateUtil';

const MAX_RESULTS = 8;
const MAX_QUICK_CHIPS = 6;
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
  const { t } = useLanguage();
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

  // Chip "NCC hay dùng": top theo số phiếu (desc), tiebreak lần nhập mới hơn trước.
  const topSuppliers = useMemo(() => {
    return [...suppliers]
      .sort((a, b) => {
        if (b.receiptCount !== a.receiptCount) return b.receiptCount - a.receiptCount;
        const ad = a.lastReceiptDate ? new Date(a.lastReceiptDate).getTime() : 0;
        const bd = b.lastReceiptDate ? new Date(b.lastReceiptDate).getTime() : 0;
        return bd - ad;
      })
      .slice(0, MAX_QUICK_CHIPS);
  }, [suppliers]);

  // Chỉ hiện chip khi CHƯA gõ query (rỗng hoặc đang = tên NCC đã chọn) để không che kết quả search.
  const showQuickChips = useMemo(() => {
    if (topSuppliers.length === 0) return false;
    const q = normalizeSearchText(rawName);
    return (
      !q ||
      Boolean(selectedSupplier && normalizeSearchText(selectedSupplier.name) === q)
    );
  }, [topSuppliers.length, rawName, selectedSupplier]);

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
            layoutClassName="absolute inset-y-0 right-2 flex items-center"
            textClassName="text-slate-400"
            hoverClassName="hover:text-slate-600 dark:hover:text-slate-200"
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
            <Typography as="span" textClassName="font-medium">Đã chọn: {selectedSupplier.name}</Typography>
            <Button
              type="button"
              onClick={handleClear}
              aria-label="Bỏ chọn NCC"
              layoutClassName="ml-1"
              roundedClassName="rounded-full"
              hoverClassName="hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
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
            <Typography as="span" textClassName="font-medium">Sẽ tạo NCC mới</Typography>
          </Box>
        )}
      </Box>

      {showQuickChips ? (
        <Box layoutClassName="mt-2 flex flex-col gap-1.5">
          <Typography
            size="xs"
            variant="muted"
            layoutClassName="font-medium uppercase tracking-wide"
          >
            {t('billImport.quickPickSuppliers')}
          </Typography>
          <Box layoutClassName="flex flex-wrap gap-1.5">
            {topSuppliers.map((s) => {
              const isCurrent = s.id === selectedId;
              return (
                <Button
                  type="button"
                  key={s.id}
                  onClick={() => handlePickExisting(s)}
                  layoutClassName="inline-flex max-w-[12rem] items-center gap-1"
                  sizeClassName="px-2.5 py-1 text-xs"
                  roundedClassName="rounded-full"
                  borderClassName={
                    isCurrent
                      ? 'border border-emerald-400 dark:border-emerald-600'
                      : 'border border-slate-200 dark:border-slate-700'
                  }
                  backgroundClassName={
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/40'
                      : 'bg-white dark:bg-slate-800'
                  }
                  textClassName={
                    isCurrent
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-slate-700 dark:text-slate-200'
                  }
                  hoverClassName={
                    isCurrent
                      ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                >
                  {isCurrent ? <Check className="h-3 w-3 shrink-0" /> : null}
                  <Typography as="span" layoutClassName="truncate" textClassName="font-medium">
                    {s.name}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </Box>
      ) : null}

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
                    layoutClassName="flex w-full flex-col gap-1 text-left transition-colors"
                    sizeClassName="px-3 py-2 text-sm"
                    backgroundClassName={isCurrent ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : undefined}
                    hoverClassName={
                      isCurrent
                        ? 'hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40'
                        : 'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }
                   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                    <Box layoutClassName="flex items-center justify-between gap-2">
                      <Box layoutClassName="flex min-w-0 items-center gap-2">
                        {isCurrent ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : isTopHint ? (
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                        ) : null}
                        <Typography
                          as="span"
                          layoutClassName="truncate"
                          textClassName="font-medium text-slate-800 dark:text-slate-100"
                        >
                          {s.name}
                        </Typography>
                        {isCurrent ? (
                          <Typography
                            as="span"
                            layoutClassName="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 dark:bg-emerald-900/60"
                            textClassName="text-[10px] font-medium text-emerald-700 dark:text-emerald-200"
                          >
                            đang chọn
                          </Typography>
                        ) : null}
                      </Box>
                      <Typography
                        as="span"
                        layoutClassName="shrink-0"
                        textClassName="text-xs text-slate-500 dark:text-slate-400"
                      >
                        {s.receiptCount}p · {moneyFmt.format(s.totalAmount)}đ
                      </Typography>
                    </Box>
                    <Box layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {s.phone ? <Typography as="span" size="xs">📞 {s.phone}</Typography> : null}
                      {s.address ? (
                        <Typography as="span" size="xs" layoutClassName="truncate">📍 {s.address}</Typography>
                      ) : null}
                      {s.category ? <Typography as="span" size="xs">🏷️ {s.category}</Typography> : null}
                      {s.lastReceiptDate ? (
                        <Typography as="span" size="xs">Lần cuối: {formatDateISO(s.lastReceiptDate)}</Typography>
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
              layoutClassName="flex w-full items-center gap-2 text-left"
              sizeClassName="px-3 py-2 text-sm"
              textClassName="text-primary-700 dark:text-primary-300"
              hoverClassName="hover:bg-primary-50 dark:hover:bg-primary-900/20"
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-t border-slate-100 dark:border-slate-700">
              <Plus className="h-4 w-4" />
              <Typography as="span">
                Tạo NCC mới: <Typography as="span" textClassName="font-semibold">{rawName.trim()}</Typography>
              </Typography>
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
                lần cuối {formatDateISO(selectedSupplier.lastReceiptDate)}
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
