import React from 'react';
import { AlertTriangle, Clock, Filter, Truck, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import FilterToolbar, { type ToolbarPill, type ToolbarOption } from '@/components/shared/FilterToolbar';

export interface QuickPillState {
  pending: boolean;
  unpaid: boolean;
  today: boolean;
  overdue: boolean;
}

export type OrderSortKey =
  | 'date-desc' | 'date-asc'
  | 'total-desc' | 'total-asc'
  | 'deliveryDate-asc' | 'deliveryDate-desc'
  | 'status-asc' | 'paymentStatus-asc';

interface OrderFiltersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenAdvanced: () => void;
  activeFiltersCount?: number;
  quickPills?: QuickPillState;
  onTogglePending?: () => void;
  onToggleUnpaid?: () => void;
  onToggleToday?: () => void;
  onToggleOverdue?: () => void;
  sortKey?: OrderSortKey;
  onSortChange?: (k: OrderSortKey) => void;
  onClearAll?: () => void;
}

const OrderFiltersToolbar: React.FC<OrderFiltersToolbarProps> = ({
  searchTerm, onSearchChange, onOpenAdvanced, activeFiltersCount = 0,
  quickPills, onTogglePending, onToggleUnpaid, onToggleToday, onToggleOverdue,
  sortKey, onSortChange, onClearAll,
}) => {
  const { t } = useLanguage();
  const SORT_OPTIONS: ToolbarOption[] = [
    { value: 'date-desc',         label: t('orders.sort.newest') },
    { value: 'date-asc',          label: t('orders.sort.oldest') },
    { value: 'total-desc',        label: t('orders.sort.totalDesc') },
    { value: 'total-asc',         label: t('orders.sort.totalAsc') },
    { value: 'deliveryDate-asc',  label: t('orders.sort.deliveryAsc') },
    { value: 'deliveryDate-desc', label: t('orders.sort.deliveryDesc') },
    { value: 'status-asc',        label: t('orders.sort.status') },
    { value: 'paymentStatus-asc', label: t('orders.sort.payment') },
  ];
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
          <Filter className="h-5 w-5 text-primary-500" />
          {t('orders.recent')}
        </Heading>
      </Box>
      <FilterToolbar
        search={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('orders.searchPlaceholder')}
        sortBy={sortKey}
        sortOptions={onSortChange ? SORT_OPTIONS : undefined}
        onSortChange={onSortChange ? (v) => onSortChange(v as OrderSortKey) : undefined}
        onOpenAdvanced={onOpenAdvanced}
        advancedFiltersCount={activeFiltersCount}
        pills={pills}
        onClearAll={onClearAll}
      />
    </Box>
  );
};

export default OrderFiltersToolbar;
