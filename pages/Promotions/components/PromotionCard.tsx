import React, { useState } from 'react';
import { Percent, Banknote, Truck, Gift, Pencil, Trash2, Calendar, ShoppingBag, Ticket, RotateCcw, History, ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import { Promotion, DiscountType, discountTypeLabel } from '@/types/promotion';
import type { ProductCategory } from '@/types/category';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { formatDateRange, categoryName, promotionState, runsCount } from '../promotionUtils';

/** Icon + màu theo loại giảm (nền nhạt + chữ đậm). */
const TYPE_META: Record<DiscountType, { Icon: React.ComponentType<{ className?: string }>; iconBg: string; iconText: string }> = {
  PERCENT: { Icon: Percent, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400' },
  FIXED: { Icon: Banknote, iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconText: 'text-sky-600 dark:text-sky-400' },
  FREE_SHIP: { Icon: Truck, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
  BUY_X_GET_Y: { Icon: Gift, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400' },
};

/** Badge trạng thái hiệu lực. */
const STATE_META = {
  running: { label: 'đang chạy', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  ended: { label: 'đã kết thúc', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  off: { label: 'tắt', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500' },
} as const;

interface PromotionCardProps {
  promotion: Promotion;
  categories: ProductCategory[];
  onEdit: (p: Promotion) => void;
  onDelete: (p: Promotion) => void;
  onReopen: (p: Promotion) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion: p, categories, onEdit, onDelete, onReopen }) => {
  const meta = TYPE_META[p.discountType] ?? TYPE_META.FIXED;
  const { Icon } = meta;
  const state = promotionState(p);
  const stateMeta = STATE_META[state];
  const totalRuns = runsCount(p);
  const history = p.runs ?? [];
  const [showHistory, setShowHistory] = useState(false);

  const valueLabel = (): string => {
    if (p.discountType === 'PERCENT')
      return `Giảm ${p.discountValue ?? 0}%${p.maxDiscount ? ` (tối đa ${formatVND(p.maxDiscount)})` : ''}`;
    if (p.discountType === 'FIXED') return `Giảm ${formatVND(p.discountValue ?? 0)}`;
    if (p.discountType === 'FREE_SHIP') return 'Miễn phí ship';
    if (p.discountType === 'BUY_X_GET_Y') {
      const gn = categoryName(categories, p.groupCategoryId);
      return `Mua ${p.buyQuantity ?? 3} tặng ${p.getQuantity ?? 1}${gn ? ` · nhóm ${gn}` : ''}`;
    }
    return '—';
  };

  const hasLimit = p.maxUses != null && p.maxUses > 0;
  const pct = hasLimit ? Math.min(100, Math.round(((p.usedCount || 0) / (p.maxUses as number)) * 100)) : 0;

  return (
    <Card padding="none">
      <Box layoutClassName="flex items-start gap-3 p-4">
        {/* Icon loại giảm */}
        <Box layoutClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" backgroundClassName={meta.iconBg}>
          <Icon className={`h-5 w-5 ${meta.iconText}`} />
        </Box>

        {/* Nội dung */}
        <Box layoutClassName="min-w-0 flex-1 space-y-1.5">
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{p.name}</Typography>
            {p.applyMode === 'CODE' && p.code ? (
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-primary-100 dark:bg-primary-900/30" textClassName="font-mono text-primary-700 dark:text-primary-300">{p.code}</Badge>
            ) : (
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-sky-100 dark:bg-sky-900/30" textClassName="text-sky-700 dark:text-sky-300">tự áp</Badge>
            )}
            <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{discountTypeLabel(p.discountType)}</Badge>
            <Badge size="sm" borderClassName="border-transparent" backgroundClassName={stateMeta.bg} textClassName={stateMeta.text}>
              {stateMeta.label}
            </Badge>
            {totalRuns > 1 ? (
              <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-violet-100 dark:bg-violet-900/30" textClassName="text-violet-700 dark:text-violet-300">
                lần chạy #{totalRuns}
              </Badge>
            ) : null}
          </Box>

          <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">
            {valueLabel()}
          </Typography>

          {/* Meta: thời gian + đơn tối thiểu */}
          <Box layoutClassName="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Box layoutClassName="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <Typography as="span" size="xs" variant="muted">{formatDateRange(p.startAt, p.endAt)}</Typography>
            </Box>
            {p.minOrderValue ? (
              <Box layoutClassName="flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                <Typography as="span" size="xs" variant="muted">Đơn từ {formatVND(p.minOrderValue)}</Typography>
              </Box>
            ) : null}
          </Box>

          {/* Lượt dùng (đợt hiện tại) */}
          <Box layoutClassName="flex items-center gap-2 pt-0.5">
            <Ticket className="h-3.5 w-3.5 text-slate-400" />
            {hasLimit ? (
              <>
                <Box layoutClassName="h-1.5 w-28 overflow-hidden rounded-full" backgroundClassName="bg-slate-200 dark:bg-slate-700">
                  <Box layoutClassName="h-full rounded-full" backgroundClassName={pct >= 100 ? 'bg-red-500' : 'bg-primary-500'} style={{ width: `${pct}%` }} />
                </Box>
                <Typography as="span" size="xs" variant="muted">{p.usedCount || 0}/{p.maxUses} lượt (đợt này)</Typography>
              </>
            ) : (
              <Typography as="span" size="xs" variant="muted">{p.usedCount || 0} lượt · không giới hạn</Typography>
            )}
          </Box>

          {/* Lịch sử các đợt chạy đã đóng */}
          {history.length > 0 ? (
            <Box layoutClassName="pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory((v) => !v)}
                disableVariantHover
                disableVariantTextColor
                borderClassName="border-transparent"
                layoutClassName="flex items-center gap-1 px-0 py-0"
                textClassName="text-slate-500 dark:text-slate-400"
                hoverClassName="hover:text-primary-500"
                leftIcon={<History className="h-3.5 w-3.5" />}
              >
                <Typography as="span" size="xs" layoutClassName="font-medium">Lịch sử {history.length} đợt trước</Typography>
                {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
              {showHistory ? (
                <Box layoutClassName="mt-1.5 space-y-1 rounded-lg p-2" backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
                  {history.map((r, i) => (
                    <Box key={i} layoutClassName="flex items-center justify-between gap-2">
                      <Box layoutClassName="flex items-center gap-1.5">
                        <Repeat className="h-3 w-3 text-slate-400" />
                        <Typography as="span" size="xs" variant="muted">Đợt {i + 1}: {formatDateRange(r.startAt, r.endAt)}</Typography>
                      </Box>
                      <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-600 dark:text-slate-300">{r.usedCount || 0} lượt</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </Box>

        {/* Hành động */}
        <Box layoutClassName="flex shrink-0 items-center gap-1">
          {state !== 'running' ? (
            <IconButton label="Mở lại đợt mới" variant="ghost" size="sm" onClick={() => onReopen(p)} textClassName="text-slate-400" hoverClassName="hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <RotateCcw className="h-4 w-4" />
            </IconButton>
          ) : null}
          <IconButton label="Sửa" variant="ghost" size="sm" onClick={() => onEdit(p)} textClassName="text-slate-400" hoverClassName="hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20">
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label="Xoá" variant="ghost" size="sm" onClick={() => onDelete(p)} textClassName="text-slate-400" hoverClassName="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default PromotionCard;
