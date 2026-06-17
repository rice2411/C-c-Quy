/**
 * CompactCard — product card cực gọn cho view dày đặc.
 */
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/types';
import { calcMargin, marginColor } from '@/utils/product/productMargin';
import type { ProductSalesMetric } from '@/pages/Storage/product/productStats';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';

import Heading from '@/components/ui/Heading';
interface CompactCardProps {
  product: Product;
  metric?: ProductSalesMetric;
  selected: boolean;
  onSelectToggle: () => void;
  onEdit: () => void;
}

const CompactCard: React.FC<CompactCardProps> = ({ product, metric, selected, onSelectToggle, onEdit }) => {
  const m = calcMargin(product);
  const marg = marginColor(m);
  return (
    <Card
      padding="none"
      onClick={onEdit}
      borderClassName={
        selected
          ? 'border-2 border-primary-400 ring-2 ring-primary-300'
          : 'border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300'
      }
      roundedClassName="rounded-lg"
      shadowClassName="shadow-sm hover:shadow-md"
      stateClassName="cursor-pointer transition-all"
      layoutClassName="group relative overflow-hidden"
    >
      <div className="absolute left-1.5 top-1.5 z-20" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={onSelectToggle} className="bg-white/90" />
      </div>
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-slate-300" />
          </div>
        )}
        {m !== null ? (
          <span
            className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm"
            style={{ backgroundColor: marg.bg, color: marg.fg }}
          >
            {marg.label}
          </span>
        ) : null}
        {product.gallery && product.gallery.length > 0 ? (
          <span
            className="absolute left-1 bottom-1 inline-flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm"
            title={`${product.gallery.length + 1} ảnh`}
          >
            <ImageIcon className="h-2.5 w-2.5" /> {product.gallery.length + 1}
          </span>
        ) : null}
      </div>
      <div className="p-2 space-y-1">
        <Heading level={3} textClassName="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white" title={product.name}>
          {product.name}
        </Heading>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 font-bold ${
              product.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {product.status === 'active' ? '●' : '○'}
          </span>
        </div>
        {metric && metric.unitsSold > 0 ? (
          <p className="text-[10px] text-slate-500 dark:text-slate-400">📈 {metric.unitsSold} · 30d</p>
        ) : null}
      </div>
    </Card>
  );
};

export default CompactCard;
