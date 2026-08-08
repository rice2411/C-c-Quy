import React, { useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { LedgerFilters, LedgerStatus, LEDGER_STATUS_META, EXPENSE_CATEGORIES } from '@/types';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';

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
const OUT_STATUSES: LedgerStatus[] = ['refund', 'settled', 'expense', 'excluded', 'unmatched'];

/** Toolbar lọc sổ: tìm kiếm + loại (thu/chi) + trạng thái + danh mục + ngân hàng. */
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

  const selectLayout = 'rounded-lg';
  const selectSize = 'px-3';

  return (
    <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Box layoutClassName="min-w-0 flex-1 sm:min-w-[200px]">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm nội dung, mã đơn, số TK..."
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          roundedClassName="rounded-lg"
        />
      </Box>

      <Select
        size="sm"
        value={filters.type || ''}
        onChange={(e) => onTypeChange((e.target.value || '') as LedgerFilters['type'])}
        layoutClassName={`${selectLayout} w-full sm:w-auto`}
        sizeClassName={selectSize}
      >
        <option value="">Tất cả loại</option>
        <option value="in">Tiền vào</option>
        <option value="out">Tiền ra</option>
      </Select>

      <Select
        size="sm"
        value={filters.status || ''}
        onChange={(e) => onStatusChange((e.target.value || '') as LedgerFilters['status'])}
        layoutClassName={`${selectLayout} w-full sm:w-auto`}
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
        layoutClassName={`${selectLayout} w-full sm:w-auto`}
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
          layoutClassName={`${selectLayout} w-full sm:w-auto`}
          sizeClassName={selectSize}
        >
          <option value="">Mọi ngân hàng</option>
          {gatewayOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
      )}

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
    </Box>
  );
};

export default LedgerFilterBar;
