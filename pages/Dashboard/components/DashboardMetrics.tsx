import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import { MetricCard, MetricDelta } from '@/components/ui/stats';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
interface DashboardMetricsProps {
  metrics: {
    revenue: number;
    revenueChange: number;
    completedCount: number;
    completedChange: number;
  };
  totalOrders: number;
  newOrdersToday: number;
  pendingOrders: number;
  timeRange: 'week' | 'month' | 'year';
  currentRangeLabel: string;
  prevRangeLabel: string;
  isCurrentPeriod: boolean;
}

// Helper: navigate sang Orders page kèm quick filter pre-applied qua query param
const goToOrders = (navigate: (p: string) => void, quick?: string) => {
  navigate(quick ? `/orders?quick=${quick}` : '/orders');
};

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


  // Helper: dòng chú thích xu hướng + note dưới value
  const getTrendInfo = () => {
    const trendText = isCurrentPeriod
      ? (timeRange === 'week' ? t('dashboard.fromLastWeek') : `vs prev ${timeRange}`)
      : `vs ${prevRangeLabel}`;
    const bottomNote = isCurrentPeriod ? `${currentRangeLabel} vs ${prevRangeLabel}` : currentRangeLabel;
    return { trendText, bottomNote };
  };

  const revenueInfo = getTrendInfo();
  const completedInfo = getTrendInfo();
  const navigate = useNavigate();

  const noteClass = 'text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500';
  const trendFooter = (change: number, info: { trendText: string; bottomNote: string }) => (
    <>
      <MetricDelta change={change} text={info.trendText} />
      <Typography size="xs" layoutClassName="mt-1" textClassName={noteClass}>{info.bottomNote}</Typography>
    </>
  );

  return (
    <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label={t('dashboard.totalRevenue')}
        value={formatVND(metrics.revenue)}
        icon={DollarSign}
        iconWrapClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        padding="lg"
        onClick={() => goToOrders(navigate, 'paid')}
        footer={trendFooter(metrics.revenueChange, revenueInfo)}
      />
      <MetricCard
        label={t('dashboard.totalOrders')}
        value={totalOrders}
        icon={Package}
        iconWrapClassName="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        padding="lg"
        onClick={() => goToOrders(navigate)}
        footer={(
          <Box layoutClassName="flex items-center gap-1" textClassName="text-blue-600 dark:text-blue-400">
            <TrendingUp size={16} />
            <Typography as="span" size="sm" textClassName="text-blue-600 dark:text-blue-400">+{newOrdersToday} {t('dashboard.newToday')}</Typography>
          </Box>
        )}
      />
      <MetricCard
        label={t('dashboard.pending')}
        value={pendingOrders}
        icon={AlertCircle}
        iconWrapClassName="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
        padding="lg"
        onClick={() => goToOrders(navigate, 'pending')}
        footer={<Typography as="span" size="sm" variant="muted">{t('dashboard.requiresAttention')}</Typography>}
      />
      <MetricCard
        label="Đơn hoàn tất"
        value={metrics.completedCount}
        icon={CheckCircle2}
        iconWrapClassName="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
        padding="lg"
        onClick={() => goToOrders(navigate, 'delivered')}
        footer={trendFooter(metrics.completedChange, completedInfo)}
      />
    </Box>
  );
};

export default DashboardMetrics;

