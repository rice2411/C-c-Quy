import React from 'react';
import {
  ArrowUpDown,
  Calendar,
  Filter,
  type LucideIcon,
  Search,
  X,
} from 'lucide-react';
import Box from '@/components/ui/Box';

/**
 * Shared toolbar for list-style modules (Orders, Bill Import suppliers/materials, …).
 * Compose any subset of: search · period · sort · quick pills · advanced filter button · clear-all.
 *
 * Pattern gốc lấy từ Orders toolbar — generalize để dùng chung mọi list.
 */

export interface ToolbarPill {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface ToolbarSortOption {
  value: string;
  label: string;
}

export interface ToolbarPeriodOption {
  value: string;
  label: string;
}

export interface FilterToolbarProps {
  /** Search */
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;

  /** Optional: period filter dropdown */
  period?: string;
  periodOptions?: ToolbarPeriodOption[];
  onPeriodChange?: (v: string) => void;

  /** Optional: sort dropdown */
  sortBy?: string;
  sortOptions?: ToolbarSortOption[];
  onSortChange?: (v: string) => void;

  /** Optional: quick toggle pills (Order has 4: pending/unpaid/today/overdue) */
  pills?: ToolbarPill[];

  /** Optional: open advanced filter modal */
  onOpenAdvanced?: () => void;
  advancedFiltersCount?: number;

  /** Optional: hard reset everything. Auto-show button when any filter active. */
  onClearAll?: () => void;
  /** Override visibility of clear button — default: auto */
  showClearAll?: boolean;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  period,
  periodOptions,
  onPeriodChange,
  sortBy,
  sortOptions,
  onSortChange,
  pills,
  onOpenAdvanced,
  advancedFiltersCount = 0,
  onClearAll,
  showClearAll,
}) => {
  const hasSearch = Boolean(search);
  const hasPeriod = Boolean(period && period !== 'all' && period !== '');
  const hasActivePills = (pills ?? []).some((p) => p.active);
  const hasAnyFilter = hasSearch || hasPeriod || hasActivePills || advancedFiltersCount > 0;
  const clearVisible = (showClearAll ?? hasAnyFilter) && Boolean(onClearAll);

  return (
    <Box layoutClassName="flex flex-col gap-2">
      {/* Row 1: Search + advanced button */}
      <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Box layoutClassName="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Xoá tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </Box>

        {onOpenAdvanced ? (
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="relative inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
          >
            <Filter className="h-4 w-4" />
            <span>Bộ lọc</span>
            {advancedFiltersCount > 0 ? (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                {advancedFiltersCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </Box>

      {/* Row 2: Period + Sort + Clear */}
      {(periodOptions || sortOptions || clearVisible) ? (
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          {periodOptions && onPeriodChange ? (
            <Box layoutClassName="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={period ?? 'all'}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-200 dark:[color-scheme:dark]"
              >
                {periodOptions.map((p) => (
                  <option
                    key={p.value}
                    value={p.value}
                    className="bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {p.label}
                  </option>
                ))}
              </select>
            </Box>
          ) : null}

          {sortOptions && onSortChange ? (
            <Box layoutClassName="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy ?? sortOptions[0]?.value}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-200 dark:[color-scheme:dark]"
              >
                {sortOptions.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    className="bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {s.label}
                  </option>
                ))}
              </select>
            </Box>
          ) : null}

          {clearVisible ? (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-3 w-3" /> Xoá filter
            </button>
          ) : null}
        </Box>
      ) : null}

      {/* Row 3: Quick pills */}
      {pills && pills.length > 0 ? (
        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => {
            const Icon = p.icon;
            const cls =
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ' +
              (p.active
                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300');
            return (
              <button key={p.id} type="button" onClick={p.onClick} className={cls}>
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {p.label}
              </button>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

export default FilterToolbar;
