import React from 'react';
import { Pencil, Trash2, Calendar, ShoppingBag, Ticket, RotateCcw } from 'lucide-react';
import { Promotion, discountTypeLabel } from '@/types/promotion';
import type { ProductCategory } from '@/types/category';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { formatDateRange, promotionState, runsCount } from '../promotionUtils';
import { TYPE_META, STATE_META, promotionValueLabel } from '../promotionMeta';

interface Props {
  promotion: Promotion;
  categories: ProductCategory[];
  onEdit: (p: Promotion) => void;
  onDelete: (p: Promotion) => void;
  onReopen: (p: Promotion) => void;
}

/** Thẻ khuyến mãi gọn cho chế độ lưới (grid). */
const PromotionGridCard: React.FC<Props> = ({ promotion: p, categories, onEdit, onDelete, onReopen }) => {
  const meta = TYPE_META[p.discountType] ?? TYPE_META.FIXED;
  const { Icon } = meta;
  const state = promotionState(p);
  const stateMeta = STATE_META[state];
  const totalRuns = runsCount(p);

  const hasLimit = p.maxUses != null && p.maxUses > 0;
  const pct = hasLimit ? Math.min(100, Math.round(((p.usedCount || 0) / (p.maxUses as number)) * 100)) : 0;

  return (
    <Card padding="none" layoutClassName="flex h-full flex-col">
      <Box layoutClassName="flex flex-1 flex-col gap-2 p-3.5">
        {/* Header: icon + tên + hành động */}
        <Box layoutClassName="flex items-start gap-2.5">
          <Box layoutClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" backgroundClassName={meta.iconBg}>
            <Icon className={`h-5 w-5 ${meta.iconText}`} />
          </Box>
          <Box layoutClassName="min-w-0 flex-1">
            <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-900 dark:text-white">{p.name}</Typography>
            <Typography as="p" size="xs" layoutClassName="font-medium" textClassName="text-slate-600 dark:text-slate-300">{promotionValueLabel(p, categories)}</Typography>
          </Box>
        </Box>

        {/* Badge trạng thái + loại */}
        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName={stateMeta.bg} textClassName={stateMeta.text}>{stateMeta.label}</Badge>
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{discountTypeLabel(p.discountType)}</Badge>
          {p.applyMode === 'CODE' && p.code ? (
            <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-primary-100 dark:bg-primary-900/30" textClassName="font-mono text-primary-700 dark:text-primary-300">{p.code}</Badge>
          ) : (
            <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-sky-100 dark:bg-sky-900/30" textClassName="text-sky-700 dark:text-sky-300">tự áp</Badge>
          )}
          {totalRuns > 1 ? (
            <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-violet-100 dark:bg-violet-900/30" textClassName="text-violet-700 dark:text-violet-300">#{totalRuns}</Badge>
          ) : null}
        </Box>

        {/* Meta thời gian + đơn tối thiểu */}
        <Box layoutClassName="flex flex-col gap-1">
          <Box layoutClassName="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <Typography as="span" size="xs" variant="muted">{formatDateRange(p.startAt, p.endAt)}</Typography>
          </Box>
          {p.minOrderValue ? (
            <Box layoutClassName="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
              <Typography as="span" size="xs" variant="muted">Đơn từ {p.minOrderValue.toLocaleString('vi-VN')}đ</Typography>
            </Box>
          ) : null}
        </Box>

        {/* Lượt dùng */}
        <Box layoutClassName="mt-auto flex items-center gap-2 pt-1">
          <Ticket className="h-3.5 w-3.5 text-slate-400" />
          {hasLimit ? (
            <>
              <Box layoutClassName="h-1.5 flex-1 overflow-hidden rounded-full" backgroundClassName="bg-slate-200 dark:bg-slate-700">
                <Box layoutClassName="h-full rounded-full" backgroundClassName={pct >= 100 ? 'bg-red-500' : 'bg-primary-500'} style={{ width: `${pct}%` }} />
              </Box>
              <Typography as="span" size="xs" variant="muted">{p.usedCount || 0}/{p.maxUses}</Typography>
            </>
          ) : (
            <Typography as="span" size="xs" variant="muted">{p.usedCount || 0} lượt · không giới hạn</Typography>
          )}
        </Box>
      </Box>

      {/* Hành động */}
      <Box layoutClassName="flex items-center justify-end gap-1 border-t border-slate-100 px-2.5 py-1.5 dark:border-slate-700">
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
    </Card>
  );
};

export default PromotionGridCard;
