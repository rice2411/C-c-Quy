import React from 'react';
import { Percent, Banknote, Truck, Gift } from 'lucide-react';
import type { DiscountType, Promotion } from '@/types/promotion';
import type { ProductCategory } from '@/types/category';
import { formatVND } from '@/utils/format/currencyUtil';
import { categoryName } from './promotionUtils';
import type { PromotionState } from './promotionUtils';

/** Icon + màu theo loại giảm (nền nhạt + chữ đậm). Dùng chung cho card/grid/table. */
export const TYPE_META: Record<DiscountType, { Icon: React.ComponentType<{ className?: string }>; iconBg: string; iconText: string }> = {
  PERCENT: { Icon: Percent, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400' },
  FIXED: { Icon: Banknote, iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconText: 'text-sky-600 dark:text-sky-400' },
  FREE_SHIP: { Icon: Truck, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
  BUY_X_GET_Y: { Icon: Gift, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400' },
};

/** Badge trạng thái hiệu lực. */
export const STATE_META: Record<PromotionState, { label: string; bg: string; text: string }> = {
  running: { label: 'đang chạy', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  ended: { label: 'đã kết thúc', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  off: { label: 'tắt', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500' },
};

/** Mô tả giá trị giảm (dùng chung cho card/grid/table). */
export const promotionValueLabel = (p: Promotion, categories: ProductCategory[]): string => {
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
