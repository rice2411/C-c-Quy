import React from 'react';
import { Percent, Banknote, Truck, Gift, Pencil, Trash2, Calendar, ShoppingBag, Ticket } from 'lucide-react';
import { Promotion, DiscountType, discountTypeLabel } from '@/types/promotion';
import type { ProductCategory } from '@/types/category';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { formatDateRange, categoryName } from '../promotionUtils';

/** Icon + màu theo loại giảm (nền nhạt + chữ đậm). */
const TYPE_META: Record<DiscountType, { Icon: React.ComponentType<{ className?: string }>; iconBg: string; iconText: string }> = {
  PERCENT: { Icon: Percent, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400' },
  FIXED: { Icon: Banknote, iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconText: 'text-sky-600 dark:text-sky-400' },
  FREE_SHIP: { Icon: Truck, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
  BUY_X_GET_Y: { Icon: Gift, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400' },
};

interface PromotionCardProps {
  promotion: Promotion;
  categories: ProductCategory[];
  onEdit: (p: Promotion) => void;
  onDelete: (p: Promotion) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion: p, categories, onEdit, onDelete }) => {
  const meta = TYPE_META[p.discountType] ?? TYPE_META.FIXED;
  const { Icon } = meta;

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
  const isActive = p.status === 'active';

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
            <Badge
              size="sm"
              borderClassName="border-transparent"
              backgroundClassName={isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}
              textClassName={isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}
            >
              {isActive ? 'đang chạy' : 'tắt'}
            </Badge>
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

          {/* Lượt dùng */}
          <Box layoutClassName="flex items-center gap-2 pt-0.5">
            <Ticket className="h-3.5 w-3.5 text-slate-400" />
            {hasLimit ? (
              <>
                <Box layoutClassName="h-1.5 w-28 overflow-hidden rounded-full" backgroundClassName="bg-slate-200 dark:bg-slate-700">
                  <Box layoutClassName="h-full rounded-full" backgroundClassName={pct >= 100 ? 'bg-red-500' : 'bg-primary-500'} style={{ width: `${pct}%` }} />
                </Box>
                <Typography as="span" size="xs" variant="muted">{p.usedCount || 0}/{p.maxUses} lượt</Typography>
              </>
            ) : (
              <Typography as="span" size="xs" variant="muted">{p.usedCount || 0} lượt · không giới hạn</Typography>
            )}
          </Box>
        </Box>

        {/* Hành động */}
        <Box layoutClassName="flex shrink-0 items-center gap-1">
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
