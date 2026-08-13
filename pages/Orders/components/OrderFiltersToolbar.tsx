import React from 'react';
import { AlertTriangle, Clock, Filter, MapPin, Truck, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderStatus } from '@/types/enums';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs, { type TabsItem } from '@/components/ui/Tabs';
import FilterToolbar, { type ToolbarPill, type ToolbarOption } from '@/components/shared/FilterToolbar';

/** Thứ tự tab trạng thái đơn (theo dòng vòng đời) — 'All' + các OrderStatus. */
const STATUS_TAB_ORDER: string[] = [
  'All',
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.DELIVERED,
  OrderStatus.RETURNED,
  OrderStatus.CANCELLED,
];

export interface QuickPillState {
  pending: boolean;
  unpaid: boolean;
  today: boolean;
  overdue: boolean;
  province: boolean;
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
  onToggleProvince?: () => void;
  sortKey?: OrderSortKey;
  onSortChange?: (k: OrderSortKey) => void;
  onClearAll?: () => void;
  /** Tab lọc theo trạng thái đơn ('All' | OrderStatus). */
  statusFilter?: string;
  onStatusChange?: (s: string) => void;
  /** Số đơn theo từng trạng thái (hiển thị badge trên tab). */
  statusCounts?: Record<string, number>;
  /** Nút action tuỳ biến (tạo đơn / export / làm mới) — đặt trong toolbar như Product. */
  actions?: React.ReactNode;
}

const OrderFiltersToolbar: React.FC<OrderFiltersToolbarProps> = ({
  searchTerm, onSearchChange, onOpenAdvanced, activeFiltersCount = 0,
  quickPills, onTogglePending, onToggleUnpaid, onToggleToday, onToggleOverdue, onToggleProvince,
  sortKey, onSortChange, onClearAll, statusFilter = 'All', onStatusChange, statusCounts, actions,
}) => {
  const { t } = useLanguage();
  const statusTabs: TabsItem[] = STATUS_TAB_ORDER.map((id) => {
    const count = statusCounts?.[id];
    return {
      id,
      label: id === 'All' ? t('orders.tabAll') : t(`orders.statusLabels.${id}`),
      badge:
        typeof count === 'number' ? (
          <Typography
            as="span"
            size="xs"
            layoutClassName="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5"
            backgroundClassName={statusFilter === id ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-slate-100 dark:bg-slate-700'}
            textClassName={statusFilter === id ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}
          >
            {count}
          </Typography>
        ) : undefined,
    };
  });
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
    { id: 'province', label: 'Đơn tỉnh',        active: !!quickPills?.province, onClick: onToggleProvince ?? (() => {}), icon: MapPin },
  ];
  return (
    <Box
      layoutClassName="flex shrink-0 flex-col gap-3 p-4 sm:p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="flex items-center gap-2">
        <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
          <Filter className="h-5 w-5 text-primary-500" />
          {t('orders.recent')}
        </Heading>
      </Box>
      {onStatusChange ? (
        <Box layoutClassName="-mb-1 overflow-x-auto scrollbar-hide">
          <Tabs items={statusTabs} value={statusFilter} onChange={onStatusChange} />
        </Box>
      ) : null}
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
        actions={actions}
      />
    </Box>
  );
};

export default OrderFiltersToolbar;
