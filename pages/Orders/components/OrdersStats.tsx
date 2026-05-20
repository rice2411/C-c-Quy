import React, { useMemo } from 'react';
import { AlertCircle, Package, Wallet, XCircle } from 'lucide-react';
import { Order } from '@/types';
import { OrderStatus, PaymentStatus } from '@/types/enums';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

interface OrdersStatsProps {
  orders: Order[];
}

const OrdersStats: React.FC<OrdersStatsProps> = ({ orders }) => {
  const { t } = useLanguage();

  const { totalCount, pendingCount, cancelledCount, unpaidCount } = useMemo(() => {
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
    return {
      totalCount: orders.length,
      pendingCount: pending,
      cancelledCount: cancelled,
      unpaidCount: unpaid,
    };
  }, [orders]);

  return (
    <Box layoutClassName="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card layoutClassName="flex flex-col justify-between p-5 sm:p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between gap-3">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">
              {t('dashboard.totalOrders')}
            </Typography>
            <Heading level={3} layoutClassName="mt-1 tabular-nums" textClassName="text-2xl font-bold">
              {totalCount}
            </Heading>
          </Box>
          <Box
            layoutClassName="shrink-0 p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
            textClassName="text-blue-600 dark:text-blue-400"
          >
            <Package size={20} aria-hidden />
          </Box>
        </Box>
        <Typography size="xs" layoutClassName="mt-4 font-medium tracking-wide text-slate-400 dark:text-slate-500">
          {t('orders.stats.scopeHint')}
        </Typography>
      </Card>

      <Card layoutClassName="flex flex-col justify-between p-5 sm:p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between gap-3">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">
              {t('dashboard.pending')}
            </Typography>
            <Heading level={3} layoutClassName="mt-1 tabular-nums" textClassName="text-2xl font-bold">
              {pendingCount}
            </Heading>
          </Box>
          <Box
            layoutClassName="shrink-0 p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
            textClassName="text-amber-600 dark:text-amber-400"
          >
            <AlertCircle size={20} aria-hidden />
          </Box>
        </Box>
        <Typography size="xs" layoutClassName="mt-4 text-slate-500 dark:text-slate-400">
          {t('dashboard.requiresAttention')}
        </Typography>
      </Card>

      <Card layoutClassName="flex flex-col justify-between p-5 sm:p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between gap-3">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">
              {t('orders.stats.cancelledOrders')}
            </Typography>
            <Heading level={3} layoutClassName="mt-1 tabular-nums" textClassName="text-2xl font-bold">
              {cancelledCount}
            </Heading>
          </Box>
          <Box
            layoutClassName="shrink-0 p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-100 dark:bg-slate-800/80"
            textClassName="text-slate-600 dark:text-slate-400"
          >
            <XCircle size={20} aria-hidden />
          </Box>
        </Box>
        <Typography size="xs" layoutClassName="mt-4 text-slate-500 dark:text-slate-400">
          {t('orders.stats.cancelledHint')}
        </Typography>
      </Card>

      <Card layoutClassName="flex flex-col justify-between p-5 sm:p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between gap-3">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">
              {t('orders.stats.unpaidOrders')}
            </Typography>
            <Heading level={3} layoutClassName="mt-1 tabular-nums" textClassName="text-2xl font-bold">
              {unpaidCount}
            </Heading>
          </Box>
          <Box
            layoutClassName="shrink-0 p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
            textClassName="text-rose-600 dark:text-rose-400"
          >
            <Wallet size={20} aria-hidden />
          </Box>
        </Box>
        <Typography size="xs" layoutClassName="mt-4 text-slate-500 dark:text-slate-400">
          {t('orders.stats.unpaidHint')}
        </Typography>
      </Card>
    </Box>
  );
};

export default OrdersStats;
