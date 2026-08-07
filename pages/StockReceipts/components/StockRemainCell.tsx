import React from 'react';
import { MaterialStock } from '@/types/billReceipt';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface StockRemainCellProps {
  stock?: MaterialStock;
}

const fmt = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

/**
 * Ô "Còn dư" NEO theo kiểm kê:
 * — chưa kiểm kê → badge "Chưa kiểm kê"; âm → "Hết"; dương → còn ~X đơn vị.
 * Tồn = SL kiểm kê + nhập sau − tiêu hao sau.
 */
const StockRemainCell: React.FC<StockRemainCellProps> = ({ stock }) => {
  if (!stock || !stock.hasStocktake || stock.remainingUnit === null) {
    return (
      <Badge
        size="sm"
        layoutClassName="inline-flex items-center px-2 py-0.5 text-[11px] font-medium"
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-slate-100 dark:bg-slate-700/40"
        textClassName="text-slate-400 dark:text-slate-500"
      >
        Chưa kiểm kê
      </Badge>
    );
  }

  const r = stock.remainingUnit;
  const unit = stock.unit || '';
  const tooltip = `Kiểm kê ${stock.stocktakeDate ?? ''}: ${fmt(stock.stocktakeQty ?? 0)} ${unit} · +nhập ${fmt(stock.importedAfter ?? 0)} · −dùng ${fmt(stock.consumedAfter ?? 0)}`;

  if (r < 0) {
    return (
      <Box layoutClassName="flex items-center gap-1.5" title={tooltip}>
        <Badge
          size="sm"
          layoutClassName="inline-flex items-center px-2 py-0.5 text-[11px] font-bold"
          borderClassName="border border-rose-200 dark:border-rose-700"
          backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
          textClassName="text-rose-700 dark:text-rose-300"
        >
          Hết
        </Badge>
        <Typography as="span" size="xs" variant="muted">thiếu ~{fmt(Math.abs(r))} {unit}</Typography>
      </Box>
    );
  }

  const showKg = (unit === 'g' || unit === 'ml') && (stock.remainingGrams ?? 0) >= 1000;
  const display = showKg ? `${fmt((stock.remainingGrams ?? 0) / 1000)} kg` : `${fmt(r)} ${unit}`;
  const low = r <= (stock.consumedAfter ?? 0) * 0.5;

  return (
    <Typography
      as="span"
      size="sm"
      layoutClassName="font-semibold tabular-nums"
      textClassName={low ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-300'}
      title={tooltip}
    >
      {display}
    </Typography>
  );
};

export default StockRemainCell;
