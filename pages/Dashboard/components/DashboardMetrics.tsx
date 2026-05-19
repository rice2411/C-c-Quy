import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
interface DashboardMetricsProps {
  metrics: {
    revenue: number;
    revenueChange: number;
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

  return (
    <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Revenue */}
      <Card layoutClassName="flex flex-col justify-between p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">{t('dashboard.totalRevenue')}</Typography>
            <Heading level={3} layoutClassName="mt-1" textClassName="text-2xl font-bold">{formatVND(metrics.revenue)}</Heading>
          </Box>
          <Box
            layoutClassName="p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
            textClassName="text-emerald-600 dark:text-emerald-400"
          >
            <DollarSign size={20} />
          </Box>
        </Box>
        <Box layoutClassName={`mt-4 flex items-center text-sm ${revenueInfo.colorClass}`}>
          <revenueInfo.Icon size={16} className="mr-1" />
          <Typography as="span" textClassName={revenueInfo.colorClass}>
            {revenueInfo.isPositive ? '+' : ''}{metrics.revenueChange.toFixed(1)}% {revenueInfo.trendText}
          </Typography>
        </Box>
        <Typography size="xs" layoutClassName="mt-1" textClassName="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
          {revenueInfo.bottomNote}
        </Typography>
      </Card>

      {/* Total Orders */}
      <Card layoutClassName="flex flex-col justify-between p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">{t('dashboard.totalOrders')}</Typography>
            <Heading level={3} layoutClassName="mt-1" textClassName="text-2xl font-bold">{totalOrders}</Heading>
          </Box>
          <Box
            layoutClassName="p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
            textClassName="text-blue-600 dark:text-blue-400"
          >
            <Package size={20} />
          </Box>
        </Box>
         <Box layoutClassName="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
          <TrendingUp size={16} className="mr-1" />
          <Typography as="span" textClassName="text-blue-600 dark:text-blue-400">+{newOrdersToday} {t('dashboard.newToday')}</Typography>
        </Box>
      </Card>

      {/* Pending Orders */}
      <Card layoutClassName="flex flex-col justify-between p-6" stateClassName="transition-colors">
        <Box layoutClassName="flex items-start justify-between">
          <Box>
            <Typography size="sm" variant="muted" textClassName="font-medium">{t('dashboard.pending')}</Typography>
            <Heading level={3} layoutClassName="mt-1" textClassName="text-2xl font-bold">{pendingOrders}</Heading>
          </Box>
          <Box
            layoutClassName="p-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-yellow-50 dark:bg-yellow-900/20"
            textClassName="text-yellow-600 dark:text-yellow-400"
          >
            <AlertCircle size={20} />
          </Box>
        </Box>
         <Box layoutClassName="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
          <Typography as="span" variant="muted">{t('dashboard.requiresAttention')}</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default DashboardMetrics;