import React from 'react';
import { AlertTriangle, Clock, Filter, Truck, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import FilterToolbar, { type ToolbarPill } from '@/components/shared/FilterToolbar';

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

  const pills: ToolbarPill[] = [
    { id: 'pending',  label: 'Cần xử lý',       active: !!quickPills?.pending,  onClick: onTogglePending ?? (() => {}),  icon: Clock },
    { id: 'today',    label: 'Ship hôm nay',    active: !!quickPills?.today,    onClick: onToggleToday ?? (() => {}),    icon: Truck },
    { id: 'overdue',  label: 'Quá hạn',         active: !!quickPills?.overdue,  onClick: onToggleOverdue ?? (() => {}),  icon: AlertTriangle },
    { id: 'unpaid',   label: 'Chưa thanh toán', active: !!quickPills?.unpaid,   onClick: onToggleUnpaid ?? (() => {}),   icon: Wallet },
  ];

  return (
    <Box
      layoutClassName="flex shrink-0 flex-col gap-3 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="flex items-center gap-2">
        <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
          <Filter className="h-5 w-5 text-orange-500" />
          {t('orders.recent')}
        </Heading>
      </Box>

      <FilterToolbar
        search={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('orders.searchPlaceholder')}
        onOpenAdvanced={onOpenAdvanced}
        advancedFiltersCount={activeFiltersCount}
        pills={pills}
      />
    </Box>
  );
};

export default OrderFiltersToolbar;
