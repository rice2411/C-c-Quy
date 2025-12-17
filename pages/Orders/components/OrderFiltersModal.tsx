import React, { useEffect, useMemo, useState } from 'react';
import { X, SlidersHorizontal, Calendar, Search, Package } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export interface OrderFiltersState {
  searchTerm: string;
  statusFilter: string;
  productFilter: string;
  selectedMonth: string;
  paymentStatusFilter: string;
  paymentMethodFilter: string;
  dateFrom: string;
  dateTo: string;
}

interface OrderFiltersModalProps {
  isOpen: boolean;
  initialValues: OrderFiltersState;
  onClose: () => void;
  onApply: (values: OrderFiltersState) => void;
}

// Modal nâng cao để lọc đa điều kiện
const OrderFiltersModal: React.FC<OrderFiltersModalProps> = ({ isOpen, initialValues, onClose, onApply }) => {
  const { t, language } = useLanguage();
  const [values, setValues] = useState<OrderFiltersState>(initialValues);

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const start = new Date(2025, 0, 1);
    const now = new Date();

    if (now < start) {
      return [
        {
          value: '2025-01',
          label: start.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }),
        },
      ];
    }

    const current = new Date(start);
    while (current <= now || (current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear())) {
      const label = current.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
      const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label });
      current.setMonth(current.getMonth() + 1);
      if (current.getFullYear() > now.getFullYear() + 1) break;
    }
    return options.reverse();
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
    }
  }, [isOpen, initialValues]);

  const handleChange = (key: keyof OrderFiltersState, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(values);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl max-h-[100vh] sm:max-h-[85vh] border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('orders.filters')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close filter modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.searchPlaceholder')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={values.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
              />
            </div>
          </div>

          {/* Grid of filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.allStatus')}</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={values.statusFilter}
                onChange={(e) => handleChange('statusFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('detail.payment')}</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={values.paymentStatusFilter}
                onChange={(e) => handleChange('paymentStatusFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                {Object.values(PaymentStatus).map((s) => (
                  <option key={s} value={s}>
                    {t(`orders.paymentStatusLabels.${s}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.filterProductPlaceholder')}</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={values.productFilter}
                  onChange={(e) => handleChange('productFilter', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('detail.paymentMethod')}</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={values.paymentMethodFilter}
                onChange={(e) => handleChange('paymentMethodFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                <option value="CASH">{t('paymentMethod.cash')}</option>
                <option value="BANKING">{t('paymentMethod.banking')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.fromDate') ?? 'From date'}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={values.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.toDate') ?? 'To date'}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={values.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('orders.allMonths')}</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={values.selectedMonth}
                onChange={(e) => handleChange('selectedMonth', e.target.value)}
              >
                <option value="">{t('orders.allMonths')}</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t('common.cancel') ?? 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
          >
            {t('common.apply') ?? 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFiltersModal;

