import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardMetricsProps {
  metrics: {
    revenue: number;
    revenueChange: number;
    avgOrderValue: number;
    avgChange: number;
  };
  totalOrders: number;
  newOrdersToday: number;
  pendingOrders: number;
  timeRange: 'week' | 'month' | 'year';
  currentRangeLabel: string;
  prevRangeLabel: string;
  isCurrentPeriod: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ 
  metrics, 
  totalOrders, 
  newOrdersToday, 
  pendingOrders,
  timeRange,
  currentRangeLabel,
  prevRangeLabel,
  isCurrentPeriod
}) => {
  const { t } = useLanguage();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Helper to generate trend text and bottom note
  const getTrendInfo = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    
    // Trend Text logic
    let trendText = '';
    if (isCurrentPeriod) {
       trendText = timeRange === 'week' ? t('dashboard.fromLastWeek') : `vs prev ${timeRange}`;
    } else {
       trendText = `vs ${prevRangeLabel}`;
    }

    // Bottom Note logic
    // If current: show detail comparison "Current vs Prev" to clarify "from last week"
    // If past: show "Selected Week" as requested by user ("show the note iss selected week")
    const bottomNote = isCurrentPeriod 
      ? `${currentRangeLabel} vs ${prevRangeLabel}`
      : currentRangeLabel;

    return { Icon, colorClass, trendText, bottomNote, isPositive };
  };

  const revenueInfo = getTrendInfo(metrics.revenueChange);
  const avgInfo = getTrendInfo(metrics.avgChange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.totalRevenue')}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatVND(metrics.revenue)}</h3>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>
        <div className={`flex items-center mt-4 text-sm ${revenueInfo.colorClass}`}>
          <revenueInfo.Icon size={16} className="mr-1" />
          <span>{revenueInfo.isPositive ? '+' : ''}{metrics.revenueChange.toFixed(1)}% {revenueInfo.trendText}</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium tracking-wide">
          {revenueInfo.bottomNote}
        </p>
      </div>

      {/* Total Orders */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.totalOrders')}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalOrders}</h3>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Package size={20} />
          </div>
        </div>
         <div className="flex items-center mt-4 text-sm text-blue-600 dark:text-blue-400">
          <TrendingUp size={16} className="mr-1" />
          <span>+{newOrdersToday} {t('dashboard.newToday')}</span>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.pending')}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingOrders}</h3>
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
            <AlertCircle size={20} />
          </div>
        </div>
         <div className="flex items-center mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>{t('dashboard.requiresAttention')}</span>
        </div>
      </div>

      {/* Avg Order Value */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.avgOrderValue')}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatVND(metrics.avgOrderValue)}</h3>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
            <TrendingDown size={20} />
          </div>
        </div>
         <div className={`flex items-center mt-4 text-sm ${avgInfo.colorClass}`}>
          <avgInfo.Icon size={16} className="mr-1" />
          <span>{avgInfo.isPositive ? '+' : ''}{metrics.avgChange.toFixed(1)}% {avgInfo.trendText}</span>
        </div>
         <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium tracking-wide">
          {avgInfo.bottomNote}
        </p>
      </div>
    </div>
  );
};

export default DashboardMetrics;