/**
 * PricingTab — tab "Giá & Cost" với cảnh báo margin.
 */
import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import type { Product } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

const PriceCard: React.FC<{ label: string; value: number; accent: string }> = ({ label, value, accent }) => (
  <Box layoutClassName="rounded-xl border-2 p-4" style={{ borderColor: accent + '55', backgroundColor: accent + '11' }}>
    <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase tracking-wide">{label}</Typography>
    <Typography size="sm" layoutClassName="mt-1 text-3xl font-black tabular-nums" style={{ color: accent }}>
      {formatVND(value)}
    </Typography>
  </Box>
);

interface PricingTabProps {
  product: Product;
  margin: number | null;
}

const PricingTab: React.FC<PricingTabProps> = ({ product, margin }) => {
  const marginColor =
    margin === null ? '#94a3b8' :
    margin < 0 ? '#dc2626' :
    margin < 0.2 ? '#eab308' : '#16a34a';

  return (
    <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-4">
      <Box layoutClassName="grid gap-3 sm:grid-cols-3">
        <PriceCard label="Giá bán" value={product.price} accent="#4abab9" />
        <PriceCard label="Giá vốn" value={product.costPrice ?? 0} accent="#64748b" />
        <Box
          layoutClassName="rounded-xl border-2 p-4"
          style={{ borderColor: marginColor, backgroundColor: marginColor + '11' }}
        >
          <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase tracking-wide">Margin</Typography>
          <Typography size="sm" layoutClassName="mt-1 text-3xl font-black tabular-nums" style={{ color: marginColor }}>
            {margin !== null ? `${(margin * 100).toFixed(0)}%` : '—'}
          </Typography>
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            Lãi: {margin !== null && product.costPrice ? formatVND(product.price - product.costPrice) : '—'}
          </Typography>
        </Box>
      </Box>

      {margin !== null && margin < 0 ? (
        <Box layoutClassName="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <Typography size="xs" textClassName="text-red-900 dark:text-red-200">
            Sản phẩm đang <strong>lỗ {Math.round(Math.abs(margin) * 100)}%</strong>. Đề nghị tăng giá lên tối thiểu {formatVND(Math.ceil((product.costPrice ?? 0) * 1.2))} (margin 20%).
          </Typography>
        </Box>
      ) : margin !== null && margin < 0.2 ? (
        <Box layoutClassName="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <Typography size="xs" textClassName="text-amber-900 dark:text-amber-200">
            Margin thấp ({Math.round(margin * 100)}%). Cân nhắc tăng giá hoặc giảm cost.
          </Typography>
        </Box>
      ) : null}
    </Card>
  );
};

export default PricingTab;
