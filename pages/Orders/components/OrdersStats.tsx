import React, { useMemo } from 'react';
import { AlertCircle, Package, Wallet, XCircle } from 'lucide-react';
import { Order } from '@/types';
import { OrderStatus, PaymentStatus } from '@/types/enums';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import StatsBanner, { type StatItem } from '@/components/ui/StatsBanner';

interface OrdersStatsProps {
  orders: Order[];
}

const OrdersStats: React.FC<OrdersStatsProps> = ({ orders }) => {
  const { t } = useLanguage();

  const items = useMemo<StatItem[]>(() => {
    let pending = 0;
    let cancelled = 0;
    let unpaid = 0;
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) {
        cancelled += 1;
      }
      if (o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING) {
        pending += 1;
      }
      if (o.paymentStatus === PaymentStatus.UNPAID && o.status !== OrderStatus.CANCELLED) {
        unpaid += 1;
      }
    }
    return [
      {
        icon: Package,
        label: t('dashboard.totalOrders'),
        value: String(orders.length),
        sub: t('orders.stats.scopeHint'),
        accent: '#2563eb',
      },
      {
        icon: AlertCircle,
        label: t('dashboard.pending'),
        value: String(pending),
        sub: t('dashboard.requiresAttention'),
        accent: '#d97706',
      },
      {
        icon: XCircle,
        label: t('orders.stats.cancelledOrders'),
        value: String(cancelled),
        sub: t('orders.stats.cancelledHint'),
        accent: '#64748b',
      },
      {
        icon: Wallet,
        label: t('orders.stats.unpaidOrders'),
        value: String(unpaid),
        sub: t('orders.stats.unpaidHint'),
        accent: '#e11d48',
      },
    ];
  }, [orders, t]);

  return (
    <Box layoutClassName="mb-6">
      <StatsBanner items={items} />
    </Box>
  );
};

export default OrdersStats;
