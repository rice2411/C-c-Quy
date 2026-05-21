import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Filter, Search, Truck, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';

export interface QuickPillState {
  pending: boolean;   // Cần xử lý — hideCompleted
  unpaid: boolean;    // Chưa thanh toán
  today: boolean;     // Cần ship hôm nay
  overdue: boolean;   // Quá hạn
}

interface OrderFiltersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenAdvanced: () => void;
  /** Số lượng filter đang active — hiện badge trên nút Bộ lọc */
  activeFiltersCount?: number;
  /** Trạng thái các quick filter pill — để highlight đúng */
  quickPills?: QuickPillState;
  onTogglePending?: () => void;
  onToggleUnpaid?: () => void;
  onToggleToday?: () => void;
  onToggleOverdue?: () => void;
}

const OrderFiltersToolbar: React.FC<OrderFiltersToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenAdvanced,
  activeFiltersCount = 0,
  quickPills,
  onTogglePending,
  onToggleUnpaid,
  onToggleToday,
  onToggleOverdue,
}) => {
  const { t } = useLanguage();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const pillClass = (active: boolean) =>
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ' +
    (active
      ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-200'
      : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300');

  return (
    <Box
      layoutClassName="flex shrink-0 flex-col gap-3 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Box layoutClassName="flex w-full items-center justify-between sm:w-auto">
          <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
            <Filter className="h-5 w-5 text-orange-500" />
            {t('orders.recent')}
          </Heading>
          <IconButton
            type="button"
            label="Toggle filters"
            variant="ghost"
            layoutClassName="sm:hidden"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            {isFiltersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </IconButton>
        </Box>

        <Box layoutClassName="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Box layoutClassName="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder={t('orders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Box>

          <Box layoutClassName="relative inline-flex w-full sm:w-auto">
            <Button
              type="button"
              onClick={onOpenAdvanced}
              variant="secondary"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
              textClassName="text-sm font-medium text-slate-700 dark:text-slate-200"
              roundedClassName="rounded-lg"
              sizeClassName="px-3 py-2"
              layoutClassName="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              stateClassName="transition-colors"
            >
              {t('orders.filters') ?? 'Filters'}
            </Button>
            {activeFiltersCount > 0 && (
              <span
                aria-label={`${activeFiltersCount} active filters`}
                className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm dark:bg-orange-500"
              >
                {activeFiltersCount}
              </span>
            )}
          </Box>
        </Box>
      </Box>

      <Box layoutClassName="flex w-full flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePending}
          className={pillClass(!!quickPills?.pending)}
        >
          <Clock className="h-3.5 w-3.5" />
          Cần xử lý
        </button>
        <button
          type="button"
          onClick={onToggleToday}
          className={pillClass(!!quickPills?.today)}
        >
          <Truck className="h-3.5 w-3.5" />
          Ship hôm nay
        </button>
        <button
          type="button"
          onClick={onToggleOverdue}
          className={pillClass(!!quickPills?.overdue)}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Quá hạn
        </button>
        <button
          type="button"
          onClick={onToggleUnpaid}
          className={pillClass(!!quickPills?.unpaid)}
        >
          <Wallet className="h-3.5 w-3.5" />
          Chưa thanh toán
        </button>
      </Box>
    </Box>
  );
};

export default OrderFiltersToolbar;
