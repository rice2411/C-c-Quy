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
import StatsBanner, { type StatItem } from '@/components/ui/StatsBanner';
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
  const items = useMemo<StatItem[]>(() => {
    const metrics = computeProductMetrics(orders, products, 30); // 30 ngày gần
    const stats = computeAggregateStats(products, metrics, orders);
    const totalWarnings =
      stats.warnings.losing + stats.warnings.lowMargin + stats.warnings.stale;

    return [
      {
        icon: Package,
        label: 'Tổng SP',
        value: String(stats.totalProducts),
        sub: `${stats.activeProducts} hoạt động · ${stats.inactiveProducts} tạm dừng`,
        accent: '#4abab9',
      },
      {
        icon: TrendingUp,
        label: 'Top bán chạy',
        value: stats.topSeller?.productName ?? '—',
        sub: stats.topSeller
          ? `${stats.topSeller.unitsSold} sp · ${formatVND(stats.topSeller.revenue)}`
          : 'Chưa có dữ liệu 30 ngày',
        accent: '#16a34a',
        valueClassName: 'line-clamp-1',
      },
      {
        icon: DollarSign,
        label: 'Doanh thu tháng',
        value: formatVND(stats.revenueThisMonth),
        sub: '30 ngày này',
        accent: '#0ea5e9',
      },
      {
        icon: Percent,
        label: 'Margin TB',
        value: `${Math.round(stats.avgMargin * 100)}%`,
        sub:
          stats.warnings.noCostPrice > 0
            ? `${stats.warnings.noCostPrice} sp chưa có cost`
            : 'Trên giá bán',
        accent:
          stats.avgMargin >= 0.3 ? '#16a34a' : stats.avgMargin >= 0.15 ? '#eab308' : '#dc2626',
      },
      {
        icon: totalWarnings > 0 ? AlertTriangle : TrendingDown,
        label: 'Cảnh báo',
        value: String(totalWarnings),
        sub:
          totalWarnings === 0
            ? 'Mọi thứ ổn'
            : [
                stats.warnings.losing ? `${stats.warnings.losing} đang lỗ` : null,
                stats.warnings.lowMargin ? `${stats.warnings.lowMargin} margin thấp` : null,
                stats.warnings.stale ? `${stats.warnings.stale} ế` : null,
              ]
                .filter(Boolean)
                .join(' · '),
        accent: totalWarnings > 0 ? '#dc2626' : '#64748b',
      },
    ];
  }, [products, orders]);

  return <StatsBanner items={items} />;
};

export default ProductStatsBanner;
