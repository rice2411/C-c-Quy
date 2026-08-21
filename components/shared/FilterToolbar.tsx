/**
 * FilterToolbar — toolbar dùng chung cho mọi list-style page.
 * Slots: actions / customFilters / viewToggle / stats.
 */
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
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface ToolbarPill {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface ToolbarOption {
  value: string;
  label: string;
}

export interface FilterToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;

  period?: string;
  periodOptions?: ToolbarOption[];
  onPeriodChange?: (v: string) => void;

  sortBy?: string;
  sortOptions?: ToolbarOption[];
  onSortChange?: (v: string) => void;

  pills?: ToolbarPill[];

  onOpenAdvanced?: () => void;
  advancedFiltersCount?: number;
  advancedLabel?: string;

  onClearAll?: () => void;
  showClearAll?: boolean;

  /** Render bên phải search bar (Create/Import/Export buttons) */
  actions?: React.ReactNode;
  /** Render trong row 2 (vd: FilterPill cho status/category) */
  customFilters?: React.ReactNode;
  /** Render đầu row 2 (vd: view mode toggle) */
  viewToggle?: React.ReactNode;
  /** Render dưới toolbar (vd: stats banner) */
  stats?: React.ReactNode;
}

export const PillDropdown: React.FC<{
  icon: LucideIcon;
  value: string;
  options: ToolbarOption[];
  onChange: (v: string) => void;
  ariaLabel: string;
}> = ({ icon: Icon, value, options, onChange, ariaLabel }) => {
  const current = options.find((o) => o.value === value)?.label ?? value;
  const isAll = value === 'all' || value === '';
  return (
    <label
      className={`group relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-sm transition-colors ${
        isAll
          ? 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-500'
          : 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/30'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className={`font-medium ${isAll ? 'text-slate-700 dark:text-slate-200' : 'text-primary-700 dark:text-primary-300'}`}>
        {current}
      </span>
      <svg className="h-3 w-3 text-slate-400 dark:text-slate-500" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0 dark:[color-scheme:dark]"
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  search, onSearchChange, searchPlaceholder = '',
  period, periodOptions, onPeriodChange,
  sortBy, sortOptions, onSortChange,
  pills,
  onOpenAdvanced, advancedFiltersCount = 0, advancedLabel = 'Bộ lọc',
  onClearAll, showClearAll,
  actions, customFilters, viewToggle, stats,
}) => {
  const hasSearch = Boolean(search);
  const hasPeriod = Boolean(period && period !== 'all' && period !== '');
  const hasActivePills = (pills ?? []).some((p) => p.active);
  const hasAnyFilter = hasSearch || hasPeriod || hasActivePills || advancedFiltersCount > 0;
  const clearVisible = (showClearAll ?? hasAnyFilter) && Boolean(onClearAll);

  const showRow2 =
    Boolean(periodOptions && onPeriodChange) ||
    Boolean(sortOptions && onSortChange) ||
    Boolean(viewToggle) ||
    Boolean(customFilters) ||
    Boolean(onOpenAdvanced) ||
    clearVisible;

  return (
    <Box layoutClassName="flex flex-col gap-2">
      <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            hasSearch ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Xoá tìm kiếm"
                className="pointer-events-auto rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null
          }
          containerClassName="flex-1"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border-slate-200 dark:border-slate-600"
          focusClassName="focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
          sizeClassName="py-2.5"
          rightIconClassName="!pointer-events-auto"
        />
        {actions ? <Box layoutClassName="flex flex-wrap items-center gap-2">{actions}</Box> : null}
      </Box>

      {showRow2 ? (
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          {viewToggle}
          {periodOptions && onPeriodChange ? (
            <PillDropdown icon={Calendar} value={period ?? 'all'} options={periodOptions} onChange={onPeriodChange} ariaLabel="Khoảng thời gian" />
          ) : null}
          {sortOptions && onSortChange ? (
            <PillDropdown icon={ArrowUpDown} value={sortBy ?? sortOptions[0]?.value ?? ''} options={sortOptions} onChange={onSortChange} ariaLabel="Sắp xếp" />
          ) : null}
          {customFilters}
          {onOpenAdvanced ? (
            <Button
              type="button"
              onClick={onOpenAdvanced}
              leftIcon={<Filter />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
              sizeClassName="px-2.5 py-1.5 text-xs"
              backgroundClassName="bg-white dark:bg-slate-800"
              borderClassName="border border-slate-200 dark:border-slate-600"
              textClassName="font-medium text-slate-700 dark:text-slate-200"
              roundedClassName="rounded-lg"
              hoverClassName="hover:border-primary-300 dark:hover:border-primary-500"
              layoutClassName="inline-flex items-center gap-1.5"
              disableVariantHover
              disableVariantTextColor
            >
              <span>{advancedLabel}</span>
              {advancedFiltersCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                  {advancedFiltersCount}
                </span>
              ) : null}
            </Button>
          ) : null}
          {clearVisible ? (
            <Button
              type="button"
              onClick={onClearAll}
              leftIcon={<X />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-3 [&_svg]:w-3"
              sizeClassName="px-2.5 py-1.5 text-xs"
              backgroundClassName="bg-white dark:bg-slate-800"
              borderClassName="border border-slate-200 dark:border-slate-600"
              textClassName="font-medium text-slate-600 dark:text-slate-300"
              roundedClassName="rounded-lg"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
              layoutClassName="inline-flex items-center gap-1"
              disableVariantHover
              disableVariantTextColor
            >
              Xoá filter
            </Button>
          ) : null}
        </Box>
      ) : null}

      {pills && pills.length > 0 ? (
        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => {
            const Icon = p.icon;
            const cls =
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ' +
              (p.active
                ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300');
            return (
              <button key={p.id} type="button" onClick={p.onClick} className={cls}>
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {p.label}
              </button>
            );
          })}
        </Box>
      ) : null}

      {stats}
    </Box>
  );
};

export default FilterToolbar;
