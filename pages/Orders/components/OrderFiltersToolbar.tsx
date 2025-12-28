import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderFiltersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenAdvanced: () => void;
}

// Toolbar tách riêng để giữ OrderList gọn gàng, dễ tái sử dụng
const OrderFiltersToolbar: React.FC<OrderFiltersToolbarProps> = ({ searchTerm, onSearchChange, onOpenAdvanced }) => {
  const { t } = useLanguage();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4 shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-500" />
            {t('orders.recent')}
          </h2>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="sm:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Toggle filters"
          >
            {isFiltersOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder')}
              className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-full placeholder-slate-400 transition-all"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t('orders.filters') ?? 'Filters'}
          </button>
        </div>
      </div>

      {/* Rút gọn: dùng modal nâng cao, toolbar chỉ còn search + nút mở */}
    </div>
  );
};

export default OrderFiltersToolbar;

