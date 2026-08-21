import React, { useMemo } from 'react';
import { RefreshCw, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { LedgerFilters, LedgerStatus, LEDGER_STATUS_META, EXPENSE_CATEGORIES } from '@/types';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import FilterToolbar, { type ToolbarPill } from '@/components/shared/FilterToolbar';

interface LedgerFilterBarProps {
  filters: LedgerFilters;
  search: string;
  gatewayOptions: string[];
  isFetching: boolean;
  onSearchChange: (v: string) => void;
  onTypeChange: (v: LedgerFilters['type']) => void;
  onStatusChange: (v: LedgerFilters['status']) => void;
  onCategoryChange: (v: string) => void;
  onGatewayChange: (v: string) => void;
  onRefresh: () => void;
}

const IN_STATUSES: LedgerStatus[] = ['matched', 'shopee', 'external', 'unmatched'];
const OUT_STATUSES: LedgerStatus[] = ['refund', 'settled', 'expense', 'stock', 'excluded', 'unmatched'];

/**
 * Toolbar lọc sổ giao dịch — dùng chung FilterToolbar (chuẩn như trang Đơn hàng):
 * tìm kiếm + pill nhanh Tiền vào/Tiền ra + dropdown trạng thái/danh mục/ngân hàng.
 */
const LedgerFilterBar: React.FC<LedgerFilterBarProps> = ({
  filters, search, gatewayOptions, isFetching,
  onSearchChange, onTypeChange, onStatusChange, onCategoryChange, onGatewayChange, onRefresh,
}) => {
  // Trạng thái khả dụng theo loại đang chọn (thu ≠ chi).
  const statusOptions = useMemo<LedgerStatus[]>(() => {
    if (filters.type === 'in') return IN_STATUSES;
    if (filters.type === 'out') return OUT_STATUSES;
    return [...IN_STATUSES, ...OUT_STATUSES.filter((s) => s !== 'unmatched')];
  }, [filters.type]);

  // Pill nhanh: Tiền vào / Tiền ra (loại trừ nhau, bấm lại để bỏ).
  const pills: ToolbarPill[] = [
    {
      id: 'in',
      label: 'Tiền vào',
      active: filters.type === 'in',
      onClick: () => onTypeChange(filters.type === 'in' ? '' : 'in'),
      icon: ArrowDownCircle,
    },
    {
      id: 'out',
      label: 'Tiền ra',
      active: filters.type === 'out',
      onClick: () => onTypeChange(filters.type === 'out' ? '' : 'out'),
      icon: ArrowUpCircle,
    },
  ];

  const selectLayout = 'rounded-lg w-full sm:w-auto';
  const selectSize = 'px-3';

  const hasAnyFilter = Boolean(
    filters.type || filters.status || filters.category || filters.gateway || search,
  );

  return (
    <FilterToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm nội dung, mã đơn, số TK..."
      pills={pills}
      customFilters={
        <>
          <Select
            size="sm"
            value={filters.status || ''}
            onChange={(e) => onStatusChange((e.target.value || '') as LedgerFilters['status'])}
            layoutClassName={selectLayout}
            sizeClassName={selectSize}
          >
            <option value="">Mọi trạng thái</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{LEDGER_STATUS_META[s].label}</option>
            ))}
          </Select>

          <Select
            size="sm"
            value={filters.category || ''}
            onChange={(e) => onCategoryChange(e.target.value)}
            layoutClassName={selectLayout}
            sizeClassName={selectSize}
          >
            <option value="">Mọi danh mục</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>

          {gatewayOptions.length > 0 && (
            <Select
              size="sm"
              value={filters.gateway || ''}
              onChange={(e) => onGatewayChange(e.target.value)}
              layoutClassName={selectLayout}
              sizeClassName={selectSize}
            >
              <option value="">Mọi ngân hàng</option>
              {gatewayOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          )}
        </>
      }
      actions={
        <IconButton
          type="button"
          label="Làm mới"
          onClick={onRefresh}
          disabled={isFetching}
          variant="secondary"
          layoutClassName="rounded-lg p-2.5"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border border-slate-200 dark:border-slate-700"
          textClassName="text-slate-600 dark:text-slate-400"
          hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
          stateClassName="transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </IconButton>
      }
      showClearAll={hasAnyFilter}
      onClearAll={() => {
        onTypeChange('');
        onStatusChange('');
        onCategoryChange('');
        onGatewayChange('');
        onSearchChange('');
      }}
    />
  );
};

export default LedgerFilterBar;
