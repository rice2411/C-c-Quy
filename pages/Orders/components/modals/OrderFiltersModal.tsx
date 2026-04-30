import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Package, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderStatus, PaymentStatus } from '@/types';
import { useFadeAnimation } from '@/hooks/useFadeAnimation';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';

export interface OrderFiltersState {
  searchTerm: string;
  statusFilter: string;
  productFilter: string;
  selectedMonth: string;
  paymentStatusFilter: string;
  paymentMethodFilter: string;
  creatorFilter: string;
  dateFrom: string;
  dateTo: string;
  dateType: 'orderDate' | 'deliveryDate';
}

interface OrderFiltersModalProps {
  isOpen: boolean;
  initialValues: OrderFiltersState;
  creatorOptions: string[];
  onClose: () => void;
  onApply: (values: OrderFiltersState) => void;
}

const OrderFiltersModal: React.FC<OrderFiltersModalProps> = ({ isOpen, initialValues, creatorOptions, onClose, onApply }) => {
  const { t, language } = useLanguage();
  const [values, setValues] = useState<OrderFiltersState>(initialValues);
  const { show, isAnimating } = useFadeAnimation(isOpen, true);

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const start = new Date(2025, 0, 1);
    const now = new Date();

    if (now < start) {
      return [
        {
          value: '2025-01',
          label: start.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })
        }
      ];
    }

    const current = new Date(start);
    const maxIterations = 120;
    let iterations = 0;

    while (iterations < maxIterations) {
      const currentYear = current.getFullYear();
      const currentMonth = current.getMonth();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();

      if (currentYear > nowYear || (currentYear === nowYear && currentMonth > nowMonth)) {
        break;
      }

      const label = current.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
      const value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      options.push({ value, label });

      current.setMonth(currentMonth + 1);
      iterations++;
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

  const handleReset = () => {
    const defaultValues: OrderFiltersState = {
      searchTerm: '',
      statusFilter: 'All',
      productFilter: '',
      selectedMonth: '',
      paymentStatusFilter: 'All',
      paymentMethodFilter: 'All',
      creatorFilter: '',
      dateFrom: '',
      dateTo: '',
      dateType: 'orderDate'
    };
    setValues(defaultValues);
    onApply(defaultValues);
  };

  if (!show && !isOpen) return null;

  return (
    <Box layoutClassName="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <Box
        layoutClassName="fixed inset-0 bg-black/40 transition-opacity duration-300 ease-out"
        stateClassName={isAnimating ? 'opacity-100' : 'opacity-0'}
        onClick={onClose}
        aria-hidden="true"
      />
      <Box
        layoutClassName="relative flex h-full w-full flex-col overflow-hidden border-0 border-slate-200 bg-white pt-16 pb-20 shadow-xl transform transition-all duration-300 ease-out dark:border-slate-700 dark:bg-slate-800 sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl sm:border sm:pt-0 sm:pb-0"
        stateClassName={
          isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
        }
      >
        <Box
          layoutClassName="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700"
        >
          <Box layoutClassName="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-orange-500" />
            <Heading level={3} textClassName="text-lg font-semibold">
              {t('orders.filters')}
            </Heading>
          </Box>
          <IconButton
            type="button"
            label="Close filter modal"
            variant="ghost"
            layoutClassName="rounded-full"
            hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </Box>

        <Box layoutClassName="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <Field label={t('orders.searchPlaceholder')} htmlFor="order-filters-search">
            <Input
              id="order-filters-search"
              type="text"
              value={values.searchTerm}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Field>

          <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('orders.allStatus')} htmlFor="order-filters-status">
              <Select
                id="order-filters-status"
                fullWidth
                value={values.statusFilter}
                onChange={(e) => handleChange('statusFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('detail.payment')} htmlFor="order-filters-payment-status">
              <Select
                id="order-filters-payment-status"
                fullWidth
                value={values.paymentStatusFilter}
                onChange={(e) => handleChange('paymentStatusFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                {Object.values(PaymentStatus).map((s) => (
                  <option key={s} value={s}>
                    {t(`orders.paymentStatusLabels.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('orders.filterProductPlaceholder')} htmlFor="order-filters-product">
              <Input
                id="order-filters-product"
                type="text"
                value={values.productFilter}
                onChange={(e) => handleChange('productFilter', e.target.value)}
                leftIcon={<Package />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>

            <Field label={t('detail.paymentMethod')} htmlFor="order-filters-payment-method">
              <Select
                id="order-filters-payment-method"
                fullWidth
                value={values.paymentMethodFilter}
                onChange={(e) => handleChange('paymentMethodFilter', e.target.value)}
              >
                <option value="All">{t('orders.allStatus')}</option>
                <option value="CASH">{t('paymentMethod.cash')}</option>
                <option value="BANKING">{t('paymentMethod.banking')}</option>
              </Select>
            </Field>

            <Field label="Người tạo đơn" htmlFor="order-filters-creator">
              <Select
                id="order-filters-creator"
                fullWidth
                value={values.creatorFilter}
                onChange={(e) => handleChange('creatorFilter', e.target.value)}
              >
                <option value="">Tất cả người tạo</option>
                {creatorOptions.map((creator) => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('orders.dateType')}>
              <Box layoutClassName="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="dateType"
                    value="orderDate"
                    checked={values.dateType === 'orderDate'}
                    onChange={(e) => handleChange('dateType', e.target.value as 'orderDate' | 'deliveryDate')}
                    className="h-4 w-4 border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <Typography as="span" size="sm" variant="secondary">
                    {t('orders.orderDateLabel')}
                  </Typography>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="dateType"
                    value="deliveryDate"
                    checked={values.dateType === 'deliveryDate'}
                    onChange={(e) => handleChange('dateType', e.target.value as 'orderDate' | 'deliveryDate')}
                    className="h-4 w-4 border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <Typography as="span" size="sm" variant="secondary">
                    {t('orders.deliveryDateLabel')}
                  </Typography>
                </label>
              </Box>
            </Field>

            <Field label={t('orders.fromDate') ?? 'From date'} htmlFor="order-filters-date-from">
              <Input
                id="order-filters-date-from"
                type="date"
                value={values.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                leftIcon={<Calendar />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>

            <Field label={t('orders.toDate') ?? 'To date'} htmlFor="order-filters-date-to">
              <Input
                id="order-filters-date-to"
                type="date"
                value={values.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                leftIcon={<Calendar />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>

            <Field label={t('orders.allMonths')} htmlFor="order-filters-month">
              <Select
                id="order-filters-month"
                fullWidth
                value={values.selectedMonth}
                onChange={(e) => handleChange('selectedMonth', e.target.value)}
              >
                <option value="">{t('orders.allMonths')}</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </Box>
        </Box>

        <Box
          layoutClassName="flex flex-shrink-0 justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <Button
            type="button"
            onClick={handleReset}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-transparent"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            textClassName="text-sm font-medium text-slate-600 dark:text-slate-300"
            roundedClassName="rounded-lg"
            sizeClassName="px-4 py-3"
            layoutClassName="touch-manipulation gap-2"
            stateClassName="transition-colors active:scale-95"
            leftIcon={<RotateCcw />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          >
            {t('common.reset') ?? 'Reset'}
          </Button>
          <Box layoutClassName="flex gap-2 sm:gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-transparent"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
              textClassName="text-sm font-medium text-slate-600 dark:text-slate-300"
              roundedClassName="rounded-lg"
              sizeClassName="px-4 py-3"
              layoutClassName="touch-manipulation"
              stateClassName="transition-colors active:scale-95"
            >
              {t('common.cancel') ?? 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              backgroundClassName="bg-orange-600"
              hoverClassName="hover:bg-orange-700"
              textClassName="text-sm font-semibold text-white"
              roundedClassName="rounded-lg"
              shadowClassName="shadow-sm"
              sizeClassName="min-w-[80px] px-6 py-3"
              layoutClassName="touch-manipulation"
              stateClassName="transition-colors active:scale-95"
              variant="primary"
              disableVariantHover
              disableVariantTextColor
            >
              {t('common.apply') ?? 'Apply'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderFiltersModal;
