import React, { useMemo } from 'react';
import { ArrowRight, Calendar, User, Package } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { STATUS_COLORS } from '@/constant/order';
import { formatVND } from '@/utils/format/currencyUtil';

interface DashboardRecentOrdersProps {
  orders: Order[];
}

const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = ({ orders }) => {
  const { t } = useLanguage();

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
        .slice(0, 5),
    [orders]
  );

  if (recentOrders.length === 0) return null;

  return (
    <Card layoutClassName="p-4 sm:p-5">
      <Box layoutClassName="mb-4 flex items-center justify-between">
        <Heading level={3} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold text-slate-800 dark:text-white">
          <Package className="w-4 h-4 text-orange-500" />
          {t('dashboard.recentOrders') || 'Recent orders'}
        </Heading>
        <Typography as="span" size="xs" textClassName="text-[11px] text-slate-500 dark:text-slate-400">
          {recentOrders.length} {t('dashboard.totalOrders')?.toLowerCase() || 'orders'}
        </Typography>
      </Box>
      <Box layoutClassName="space-y-2">
        {recentOrders.map((order) => (
          <Box
            key={order.id}
            layoutClassName="flex items-center justify-between gap-3 px-2.5 py-2.5"
            roundedClassName="rounded-lg"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/60"
            stateClassName="transition-colors"
          >
            <Box layoutClassName="flex min-w-0 items-center gap-3">
              <Box layoutClassName="flex h-9 w-9 flex-shrink-0 items-center justify-center" roundedClassName="rounded-full" backgroundClassName="bg-slate-50 dark:bg-slate-700">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              </Box>
              <Box layoutClassName="flex min-w-0 flex-col">
                <Box layoutClassName="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Typography as="span" textClassName="font-mono text-[11px] text-orange-600 dark:text-orange-400">
                    #{order.orderNumber}
                  </Typography>
                  <Typography as="span">•</Typography>
                  <Calendar className="w-3 h-3" />
                  <Typography as="span">
                    {new Date(order.createdAt.toDate()).toLocaleDateString(
                      t('language') === 'vi' ? 'vi-VN' : 'en-US'
                    )}
                  </Typography>
                </Box>
                <Typography layoutClassName="truncate" textClassName="text-xs font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                  {order.customer?.name || t('orders.unknownCustomer') || 'Customer'}
                </Typography>
                <Box layoutClassName="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <Typography as="span" layoutClassName="truncate max-w-[150px] sm:max-w-[220px]">
                    {order.items?.[0]?.name || t('orders.productUnknown') || 'Product'}
                    {order.items && order.items.length > 1 && ` +${order.items.length - 1}`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box layoutClassName="flex flex-shrink-0 items-center gap-3">
              <Box layoutClassName="flex flex-col items-end">
                <Typography as="span" textClassName="text-xs font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                  {formatVND(Number(order.total) || 0)}
                </Typography>
                <Typography
                  as="span"
                  textClassName={`px-2 py-0.5 rounded-full text-[10px] font-medium border border-transparent ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {t(`orders.statusLabels.${order.status}`)}
                </Typography>
              </Box>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-500 hidden sm:block" />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default DashboardRecentOrders;


