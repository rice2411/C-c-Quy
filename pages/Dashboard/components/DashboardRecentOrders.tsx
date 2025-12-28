import React, { useMemo } from 'react';
import { ArrowRight, Calendar, User, Package } from 'lucide-react';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { STATUS_COLORS } from '@/constant/order';
import { formatVND } from '@/utils/currencyUtil';

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
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" />
          {t('dashboard.recentOrders') || 'Recent orders'}
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {recentOrders.length} {t('dashboard.totalOrders')?.toLowerCase() || 'orders'}
        </span>
      </div>
      <div className="space-y-2">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400">
                    #{order.orderNumber}
                  </span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(order.createdAt.toDate()).toLocaleDateString(
                      t('language') === 'vi' ? 'vi-VN' : 'en-US'
                    )}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {order.customer?.name || t('orders.unknownCustomer') || 'Customer'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[150px] sm:max-w-[220px]">
                    {order.items?.[0]?.name || t('orders.productUnknown') || 'Product'}
                    {order.items && order.items.length > 1 && ` +${order.items.length - 1}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatVND(Number(order.total) || 0)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border border-transparent ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {t(`orders.statusLabels.${order.status}`)}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-500 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentOrders;


