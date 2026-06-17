import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeRange = 'week' | 'month' | 'year';

interface DashboardRangeControlProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  dateRangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  isFuture: boolean;
}

/**
 * Bộ điều khiển kỳ phân tích (Tuần/Tháng/Năm + điều hướng ‹ kỳ ›).
 * Tách khỏi DashboardChart để đặt ở header vùng "Phân tích" — thể hiện rõ
 * nó chi phối TẤT CẢ widget trong vùng (Metrics, Chart, Profit, Top...).
 */
const DashboardRangeControl: React.FC<DashboardRangeControlProps> = ({
  timeRange,
  setTimeRange,
  dateRangeLabel,
  onPrev,
  onNext,
  isFuture,
}) => {
  const { t } = useLanguage();

  return (
    <Box layoutClassName="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {/* Điều hướng kỳ: ‹ nhãn › */}
      <Box
        layoutClassName="flex items-center justify-between gap-2 p-1 sm:justify-start sm:p-0"
        roundedClassName="rounded-lg"
        backgroundClassName="bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent"
      >
        <IconButton
          onClick={onPrev}
          label={t('common.previous') ?? 'Previous'}
          size="sm"
          sizeClassName="h-8 w-8"
          roundedClassName="rounded-md"
          shadowClassName="shadow-sm sm:shadow-none"
          stateClassName="transition-all"
          textClassName="text-slate-500 dark:text-slate-400"
        >
          <ChevronLeft size={16} />
        </IconButton>
        <Typography
          as="span"
          size="xs"
          layoutClassName="w-full text-center sm:w-44"
          textClassName="font-medium text-slate-600 dark:text-slate-300"
        >
          {dateRangeLabel}
        </Typography>
        <IconButton
          onClick={onNext}
          label={t('common.next') ?? 'Next'}
          size="sm"
          disabled={isFuture}
          sizeClassName="h-8 w-8"
          roundedClassName="rounded-md"
          shadowClassName="shadow-sm sm:shadow-none"
          textClassName="text-slate-500 dark:text-slate-400"
          stateClassName={`transition-all ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}`}
          hoverClassName={isFuture ? '' : 'hover:bg-white dark:hover:bg-slate-700'}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Box>

      {/* Chọn kỳ: Tuần / Tháng / Năm */}
      <Box
        layoutClassName="flex p-1"
        roundedClassName="rounded-lg"
        backgroundClassName="bg-slate-100 dark:bg-slate-700"
      >
        {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            onClick={() => setTimeRange(range)}
            variant="ghost"
            size="sm"
            layoutClassName="flex-1 transition-all sm:flex-none"
            sizeClassName="px-3 py-1.5"
            textClassName={`text-xs font-medium ${
              timeRange === range
                ? 'text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            roundedClassName="rounded-md"
            shadowClassName="shadow-none"
            borderClassName="border-0"
            baseClassName="appearance-none"
            stateClassName="active:!outline-none active:!shadow-none"
            backgroundClassName={timeRange === range ? 'bg-white dark:bg-slate-600' : ''}
          >
            {range === 'week' && t('dashboard.filterWeek')}
            {range === 'month' && t('dashboard.filterMonth')}
            {range === 'year' && t('dashboard.filterYear')}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default DashboardRangeControl;
