/**
 * GridCard — product card hiển thị trong grid view (mặc định).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, Image as ImageIcon, TrendingDown, TrendingUp } from 'lucide-react';
import type { Product } from '@/types';
import { calcMargin, marginColor } from '@/utils/product/productMargin';
import { getStockStatus } from '@/utils/product/stockStatus';
import type { ProductSalesMetric } from '@/pages/Storage/product/productStats';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import InlinePriceEditor from './InlinePriceEditor';
import StatusChip from './StatusChip';

import Heading from '@/components/ui/Heading';
export interface ProductCardCommonProps {
  product: Product;
  metric?: ProductSalesMetric;
  selected: boolean;
  onSelectToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onUpdatePrice: (n: number) => void;
  onToggleStatus: () => void;
  renderBadges: (tags?: string[]) => React.ReactNode;
  /** Render chip danh mục (màu/icon theo config). Optional để không vỡ các nơi gọi cũ. */
  renderCategory?: (category?: string) => React.ReactNode;
}

const GridCard: React.FC<ProductCardCommonProps> = ({
  product, metric, selected, onSelectToggle, onEdit, onDuplicate, onUpdatePrice, onToggleStatus, renderBadges, renderCategory,
}) => {
  const m = calcMargin(product);
  const marg = marginColor(m);
  const stock = getStockStatus(product);

  return (
    <Card
      padding="none"
      onClick={onEdit}
      borderClassName={
        selected
          ? 'border-2 border-primary-400 ring-2 ring-primary-300'
          : 'border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300'
      }
      shadowClassName="shadow-sm hover:shadow-xl"
      stateClassName="cursor-pointer transition-all"
      layoutClassName="group relative overflow-hidden"
    >
      <div className="absolute left-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onChange={onSelectToggle}
          className="h-5 w-5 cursor-pointer bg-white text-primary-600 shadow-sm"
        />
      </div>

      <div
        className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          to={`/storage/product/${product.id}`}
          title="Xem chi tiết"
          className="rounded-lg bg-white/95 p-1.5 shadow-sm hover:bg-primary-50 dark:bg-slate-700/95 dark:hover:bg-slate-600"
        >
          <ExternalLink className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
        </Link>
        <IconButton
          label="Nhân bản"
          size="sm"
          variant="ghost"
          onClick={onDuplicate}
          backgroundClassName="bg-white/95 hover:bg-primary-50 dark:bg-slate-700/95 dark:hover:bg-slate-600"
          textClassName="text-slate-600 dark:text-slate-300"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm"
        >
          <Copy className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {product.gallery && product.gallery.length > 0 ? (
          <span
            className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
            title={`${product.gallery.length + 1} ảnh`}
          >
            <ImageIcon className="h-3 w-3" /> {product.gallery.length + 1}
          </span>
        ) : null}
        <div className="absolute bottom-2 right-2">
          <StatusChip status={product.status} onToggle={onToggleStatus} />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <Heading level={3} textClassName="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white" title={product.name}>
          {product.name}
        </Heading>
        {renderCategory ? renderCategory(product.category) : null}
        {renderBadges(product.tags)}
        <div className="flex items-center justify-between pt-1">
          <InlinePriceEditor value={product.price} onSave={onUpdatePrice} />
          {m !== null ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: marg.bg, color: marg.fg }}
              title={`Margin: ${marg.label}`}
            >
              {m < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {marg.label}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {metric && metric.unitsSold > 0 ? (
            <span className="text-slate-500 dark:text-slate-400">📈 {metric.unitsSold} sp · 30d</span>
          ) : null}
          {stock.kind !== 'none' ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: stock.color + '22', color: stock.color }}
              title={stock.kind === 'out' ? 'Hết hàng' : stock.kind === 'low' ? 'Sắp hết' : 'Còn hàng'}
            >
              {stock.kind === 'out' ? '⚠ HẾT' : stock.kind === 'low' ? '⚠' : '✓'} {stock.label}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default GridCard;
