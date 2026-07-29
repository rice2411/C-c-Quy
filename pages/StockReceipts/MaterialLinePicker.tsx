import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Sparkles } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import type { ImportedMaterialSummary } from '@/types/billReceipt';
import { normalizeSearchText, similarityScore, bestMaterialMatch } from '@/utils/format/stringUtil';

const moneyFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const MAX_RESULTS = 8;

export interface MaterialLinePickerProps {
  /** Tên nguyên liệu hiện tại của dòng. */
  value: string;
  /** Danh mục NVL đã nhập trước đó (để gợi ý/khớp). */
  materials: ImportedMaterialSummary[];
  /** Đổi tên (+ tự điền đơn vị/đơn giá gần nhất khi chọn NVL có sẵn & ô đang trống). */
  onChange: (patch: { name: string; unit?: string | null; unitPrice?: number | null }) => void;
  /** Đơn vị / đơn giá hiện tại của dòng — để biết có nên tự điền khi chọn NVL không. */
  unit?: string | null;
  unitPrice?: number | null;
}

/**
 * Ô chọn nguyên liệu cho 1 dòng bill: gõ tên tự do + dropdown NVL đã có. Hiện badge NVL khớp
 * gần đúng (≥70%) kèm giá/đơn vị lần trước để tái dùng thay vì tạo trùng. Chọn 1 NVL → set tên
 * chuẩn (BE gộp theo normalized_name) + điền đơn vị/đơn giá nếu ô trống.
 */
const MaterialLinePicker: React.FC<MaterialLinePickerProps> = ({
  value,
  materials,
  onChange,
  unit,
  unitPrice,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const exact = useMemo(
    () => materials.find((m) => normalizeSearchText(m.name) === normalizeSearchText(value)) ?? null,
    [materials, value],
  );
  // NVL khớp gần đúng nhất (chỉ hiện gợi ý khi CHƯA trùng hệt).
  const near = useMemo(
    () => (exact ? null : bestMaterialMatch(value, materials, 0.7)),
    [exact, materials, value],
  );
  const matched = exact ?? near?.item ?? null;

  const filtered = useMemo(() => {
    const q = normalizeSearchText(value);
    const scored = materials
      .map((m) => ({ m, s: q ? similarityScore(value, m.name) + (normalizeSearchText(m.name).includes(q) ? 0.3 : 0) : m.importCount / 1000 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_RESULTS)
      .map((x) => x.m);
    return scored;
  }, [materials, value]);

  const pick = (m: ImportedMaterialSummary) => {
    onChange({
      name: m.name,
      unit: unit && unit.trim() ? unit : (m.canonicalUnit ?? unit),
      unitPrice: unitPrice == null || unitPrice === 0 ? (m.lastUnitPrice ?? unitPrice) : unitPrice,
    });
    setOpen(false);
  };

  return (
    <Box layoutClassName="relative min-w-0" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Box layoutClassName="relative">
        <Input
          value={value}
          onChange={(e) => onChange({ name: e.target.value })}
          onFocus={() => setOpen(true)}
          placeholder="Tên nguyên vật liệu"
        />
        <Button
          type="button"
          aria-label="Chọn nguyên liệu có sẵn"
          onClick={() => setOpen((v) => !v)}
          layoutClassName="absolute inset-y-0 right-1.5 flex items-center"
          textClassName="text-slate-400"
          hoverClassName="hover:text-slate-600 dark:hover:text-slate-200"
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          borderClassName="border-transparent"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </Box>

      {/* Badge NVL khớp — cải thiện hiển thị: cho thấy đang tái dùng NVL nào + giá lần trước */}
      {matched ? (
        <Box layoutClassName="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Typography
            as="span"
            size="xs"
            layoutClassName="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
            backgroundClassName={exact ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/40'}
            textClassName={exact ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}
          >
            {exact ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            {exact ? 'NVL đã có' : `≈ khớp: ${matched.name}`}
          </Typography>
          <Typography as="span" size="xs" variant="muted">
            {matched.importCount} lần
            {matched.lastUnitPrice ? ` · ${moneyFmt.format(matched.lastUnitPrice)}đ` : ''}
            {matched.canonicalUnit ? `/${matched.canonicalUnit}` : ''}
          </Typography>
          {near && !exact ? (
            <Button
              type="button"
              onClick={() => pick(near.item)}
              sizeClassName="px-2 py-0.5 text-xs"
              roundedClassName="rounded-full"
              borderClassName="border border-amber-300 dark:border-amber-700"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="font-medium text-amber-700 dark:text-amber-300"
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
            >
              Dùng NVL này
            </Button>
          ) : null}
        </Box>
      ) : null}

      {open && filtered.length > 0 ? (
        <Box
          layoutClassName="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg border shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          {filtered.map((m) => {
            const isCur = normalizeSearchText(m.name) === normalizeSearchText(value);
            return (
              <Button
                type="button"
                key={m.id}
                onClick={() => pick(m)}
                layoutClassName="flex w-full items-center justify-between gap-2 text-left"
                sizeClassName="px-3 py-2 text-sm"
                backgroundClassName={isCur ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : undefined}
                hoverClassName="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                borderClassName="border-transparent"
              >
                <Box layoutClassName="flex min-w-0 items-center gap-2">
                  {isCur ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : null}
                  <Typography as="span" layoutClassName="truncate" textClassName="font-medium text-slate-800 dark:text-slate-100">
                    {m.name}
                  </Typography>
                </Box>
                <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-500 dark:text-slate-400">
                  {m.importCount} lần{m.lastUnitPrice ? ` · ${moneyFmt.format(m.lastUnitPrice)}đ` : ''}
                </Typography>
              </Button>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

export default MaterialLinePicker;
