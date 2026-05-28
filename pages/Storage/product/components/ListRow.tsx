/**
 * ListRow — product row trong list view (table).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { calcMargin, marginColor } from '@/utils/product/productMargin';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { TableRow, TableCell } from '@/components/ui/Table';
import InlinePriceEditor from './InlinePriceEditor';
import StatusChip from './StatusChip';
import type { ProductCardCommonProps } from './GridCard';

const ListRow: React.FC<ProductCardCommonProps> = ({
  product, metric, selected, onSelectToggle, onEdit, onUpdatePrice, onToggleStatus, renderBadges,
}) => {
  const m = calcMargin(product);
  const marg = marginColor(m);
  return (
    <TableRow
      onClick={onEdit}
      stateClassName="cursor-pointer transition-colors"
      hoverClassName="hover:bg-orange-50/40 dark:hover:bg-orange-950/20"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
      layoutClassName={selected ? 'bg-orange-50/60 dark:bg-orange-950/30' : ''}
    >
      <TableCell layoutClassName="p-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={onSelectToggle} />
      </TableCell>
      <TableCell layoutClassName="p-2">
        <div className="flex items-center gap-2">
          {product.image ? (
            <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-700">
              <ImageIcon className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</div>
            <div className="mt-0.5">{renderBadges(product.tags)}</div>
          </div>
        </div>
      </TableCell>
      <TableCell layoutClassName="p-2 text-slate-600 dark:text-slate-400">{product.category || '—'}</TableCell>
      <TableCell layoutClassName="p-2 text-right" onClick={(e) => e.stopPropagation()}>
        <InlinePriceEditor value={product.price} onSave={onUpdatePrice} />
      </TableCell>
      <TableCell layoutClassName="p-2 text-right">
        {m !== null ? (
          <span className="font-semibold" style={{ color: marg.fg }}>{marg.label}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell layoutClassName="p-2 text-right text-xs text-slate-600 dark:text-slate-400">
        {metric ? `${metric.unitsSold} sp` : '—'}
      </TableCell>
      <TableCell layoutClassName="p-2 text-center" onClick={(e) => e.stopPropagation()}>
        <StatusChip status={product.status} onToggle={onToggleStatus} />
      </TableCell>
      <TableCell layoutClassName="p-2 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <Link to={`/storage/product/${product.id}`} title="Chi tiết">
            <IconButton label="Chi tiết" variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </IconButton>
          </Link>
          <IconButton label="Sửa nhanh" variant="ghost" size="sm" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ListRow;
