import React, { useMemo } from 'react';
import {
  AlertTriangle,
  DollarSign,
  Package,
  Percent,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Order, Product } from '@/types';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import { formatVND } from '@/utils/format/currencyUtil';
import {
  computeAggregateStats,
  computeProductMetrics,
} from '@/pages/Storage/product/productStats';

interface Props {
  products: Product[];
  orders: Order[];
}

const ProductStatsBanner: React.FC<Props> = ({ products, orders }) => {
  const stats = useMemo(() => {
    const metrics = computeProductMetrics(orders, products, 30); // 30 ngày gần
    return computeAggregateStats(products, metrics, orders);
  }, [products, orders]);

  const totalWarnings =
    stats.warnings.losing + stats.warnings.lowMargin + stats.warnings.stale;

  return (
    <Box
      layoutClassName="grid grid-cols-2 gap-2 rounded-2xl border p-2 sm:grid-cols-3 sm:gap-3 sm:p-3 lg:grid-cols-5"
      borderClassName="border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
    >
      <Tile
        icon={Package}
        label="Tổng SP"
        value={String(stats.totalProducts)}
        sub={`${stats.activeProducts} hoạt động · ${stats.inactiveProducts} tạm dừng`}
        accent="#ea580c"
      />
      <Tile
        icon={TrendingUp}
        label="Top bán chạy"
        value={stats.topSeller?.productName ?? '—'}
        sub={
          stats.topSeller
            ? `${stats.topSeller.unitsSold} sp · ${formatVND(stats.topSeller.revenue)}`
            : 'Chưa có dữ liệu 30 ngày'
        }
        accent="#16a34a"
        valueClass="line-clamp-1"
      />
      <Tile
        icon={DollarSign}
        label="Doanh thu tháng"
        value={formatVND(stats.revenueThisMonth)}
        sub="30 ngày này"
        accent="#0ea5e9"
      />
      <Tile
        icon={Percent}
        label="Margin TB"
        value={`${Math.round(stats.avgMargin * 100)}%`}
        sub={
          stats.warnings.noCostPrice > 0
            ? `${stats.warnings.noCostPrice} sp chưa có cost`
            : 'Trên giá bán'
        }
        accent={
          stats.avgMargin >= 0.3
            ? '#16a34a'
            : stats.avgMargin >= 0.15
              ? '#eab308'
              : '#dc2626'
        }
      />
      <Tile
        icon={totalWarnings > 0 ? AlertTriangle : TrendingDown}
        label="Cảnh báo"
        value={String(totalWarnings)}
        sub={
          totalWarnings === 0
            ? 'Mọi thứ ổn'
            : [
                stats.warnings.losing ? `${stats.warnings.losing} đang lỗ` : null,
                stats.warnings.lowMargin ? `${stats.warnings.lowMargin} margin thấp` : null,
                stats.warnings.stale ? `${stats.warnings.stale} ế` : null,
              ]
                .filter(Boolean)
                .join(' · ')
        }
        accent={totalWarnings > 0 ? '#dc2626' : '#64748b'}
      />
    </Box>
  );
};

const Tile: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  valueClass?: string;
}> = ({ icon: Icon, label, value, sub, accent, valueClass = '' }) => (
  <Box
    layoutClassName="flex items-center gap-2 rounded-xl p-2 sm:gap-3 sm:p-3"
    backgroundClassName="bg-white/70 dark:bg-slate-800/40"
    borderClassName="border border-slate-100 dark:border-slate-700"
  >
    <Box
      layoutClassName="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11"
      style={{ backgroundColor: accent + '22', color: accent }}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </Box>
    <Box layoutClassName="min-w-0 flex-1">
      <Typography
        size="xs"
        variant="muted"
        layoutClassName="font-medium uppercase tracking-wide truncate"
      >
        {label}
      </Typography>
      <Typography
        size="sm"
        layoutClassName={`font-bold leading-tight truncate sm:text-base ${valueClass}`}
        textClassName="text-slate-900 dark:text-white"
      >
        {value}
      </Typography>
      {sub ? (
        <Typography size="xs" variant="muted" layoutClassName="mt-0.5 truncate">
          {sub}
        </Typography>
      ) : null}
    </Box>
  </Box>
);

export default ProductStatsBanner;
