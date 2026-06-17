import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Calendar, Filter, Package, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
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

export type SortFieldKey = 'date' | 'deliveryDate' | 'total' | 'status' | 'orderNumber';

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
  sortField: SortFieldKey;
  sortDirection: 'asc' | 'desc';
  /** Ẩn các đơn DELIVERED / CANCELLED / RETURNED — chỉ hiện đơn đang xử lý */
  hideCompleted: boolean;
}

interface OrderFiltersModalProps {
  isOpen: boolean;
  initialValues: OrderFiltersState;
  creatorOptions: string[];
  onClose: () => void;
  onApply: (values: OrderFiltersState) => void;
}

const SORT_FIELD_OPTIONS: { value: SortFieldKey; label: string }[] = [
  { value: 'date', label: 'Ngày tạo' },
  { value: 'deliveryDate', label: 'Ngày giao (gấp nhất)' },
  { value: 'total', label: 'Tổng tiền' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'orderNumber', label: 'Mã đơn' },
];

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
    setValues((prev) => ({ ...prev, [key]: value as any }));
  };

  const toggleHideCompleted = () => {
    setValues((prev) => ({ ...prev, hideCompleted: !prev.hideCompleted }));
  };

  // Date preset helpers — set dateFrom/dateTo theo các khoảng thường dùng
  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const applyDatePreset = (preset: 'today' | 'last7' | 'thisMonth' | 'last30') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let from: Date;
    let to: Date = new Date(today);
    if (preset === 'today') {
      from = new Date(today);
    } else if (preset === 'last7') {
      from = new Date(today);
      from.setDate(from.getDate() - 6);
    } else if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      from = new Date(today);
      from.setDate(from.getDate() - 29);
    }
    setValues((prev) => ({ ...prev, dateFrom: toYMD(from), dateTo: toYMD(to), selectedMonth: '' }));
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
      dateType: 'orderDate',
      sortField: 'date',
      sortDirection: 'desc',
      hideCompleted: false,
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
            <SlidersHorizontal className="h-5 w-5 text-primary-500" />
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

        <Box layoutClassName="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* ─── SECTION 1: SẮP XẾP ─────────────────────────────────────────── */}
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-700">
              <ArrowDownWideNarrow className="h-4 w-4 text-primary-500" />
              <Heading level={4} textClassName="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Sắp xếp
              </Heading>
            </Box>
            <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Sắp xếp theo" htmlFor="order-filters-sort-field">
                <Select
                  id="order-filters-sort-field"
                  fullWidth
                  sizeClassName="!h-[42px] !py-0 !my-0"
                  value={values.sortField}
                  onChange={(e) => handleChange('sortField', e.target.value)}
                >
                  {SORT_FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hướng">
                <Box layoutClassName="flex h-[42px] gap-2">
                  {([
                    { value: 'desc', label: 'Giảm dần', icon: <ArrowDownWideNarrow className="h-3.5 w-3.5" /> },
                    { value: 'asc',  label: 'Tăng dần', icon: <ArrowUpWideNarrow   className="h-3.5 w-3.5" /> },
                  ] as const).map(({ value, label, icon }) => {
                    const active = values.sortDirection === value;
                    return (
                      <Button
                        key={value}
                        type="button"
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        leftIcon={icon}
                        onClick={() => handleChange('sortDirection', value)}
                        layoutClassName="flex flex-1 h-full"
                        sizeClassName="px-3"
                        roundedClassName="rounded-lg"
                        shadowClassName=""
                        textClassName={`text-sm font-medium ${active ? 'text-primary-700 dark:text-primary-200' : 'text-slate-600 dark:text-slate-300'}`}
                        backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-slate-800'}
                        borderClassName={active ? 'border border-primary-300 dark:border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
                        hoverClassName={active ? '' : 'hover:border-primary-300'}
                        stateClassName="transition-colors"
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Box>
              </Field>
            </Box>
          </Box>

          {/* ─── SECTION 2: TÌM KIẾM ────────────────────────────────────────── */}
          <Box layoutClassName="space-y-4">
            <Box layoutClassName="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-700">
              <Filter className="h-4 w-4 text-primary-500" />
              <Heading level={4} textClassName="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Tìm kiếm
              </Heading>
            </Box>

            {/* Quick toggle — Ẩn đơn đã hoàn thành */}
            <Button
              type="button"
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              onClick={toggleHideCompleted}
              layoutClassName="flex w-full items-center justify-between gap-3"
              sizeClassName="px-4 py-3"
              roundedClassName="rounded-lg"
              shadowClassName=""
              backgroundClassName={values.hideCompleted ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-slate-50 dark:bg-slate-700/30'}
              borderClassName={values.hideCompleted ? 'border border-primary-300 dark:border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
              hoverClassName={values.hideCompleted ? '' : 'hover:border-primary-300'}
              stateClassName="text-left transition-colors"
            >
              <Box layoutClassName="flex flex-col">
                <Typography as="span" size="sm" textClassName={values.hideCompleted ? 'font-semibold text-primary-700 dark:text-primary-200' : 'font-semibold text-slate-700 dark:text-slate-200'}>
                  Ẩn đơn đã hoàn thành
                </Typography>
                <Typography as="span" size="xs" variant="muted">
                  Bỏ qua đơn đã giao, đã huỷ và đã trả hàng
                </Typography>
              </Box>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  values.hideCompleted ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    values.hideCompleted ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </Button>

            {/* Tìm theo từ khoá */}
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

            {/* Group: trạng thái đơn + thanh toán */}
            <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Trạng thái đơn" htmlFor="order-filters-status">
                <Select
                  id="order-filters-status"
                  fullWidth
                  value={values.statusFilter}
                  onChange={(e) => handleChange('statusFilter', e.target.value)}
                >
                  <option value="All">Tất cả</option>
                  {Object.values(OrderStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Tình trạng thanh toán" htmlFor="order-filters-payment-status">
                <Select
                  id="order-filters-payment-status"
                  fullWidth
                  value={values.paymentStatusFilter}
                  onChange={(e) => handleChange('paymentStatusFilter', e.target.value)}
                >
                  <option value="All">Tất cả</option>
                  {Object.values(PaymentStatus).map((s) => (
                    <option key={s} value={s}>
                      {t(`orders.paymentStatusLabels.${s}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Phương thức thanh toán" htmlFor="order-filters-payment-method">
                <Select
                  id="order-filters-payment-method"
                  fullWidth
                  value={values.paymentMethodFilter}
                  onChange={(e) => handleChange('paymentMethodFilter', e.target.value)}
                >
                  <option value="All">Tất cả</option>
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
                  <option value="">Tất cả</option>
                  {creatorOptions.map((creator) => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
                </Select>
              </Field>
            </Box>

            {/* Sản phẩm — full width */}
            <Field label="Lọc theo tên sản phẩm" htmlFor="order-filters-product">
              <Input
                id="order-filters-product"
                type="text"
                value={values.productFilter}
                onChange={(e) => handleChange('productFilter', e.target.value)}
                placeholder="VD: matcha, combo, bánh mì..."
                leftIcon={<Package />}
                leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              />
            </Field>

            {/* Sub-group: Theo ngày */}
            <Box
              layoutClassName="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-700/20"
            >
              <Box layoutClassName="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <Typography as="span" size="xs" layoutClassName="font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Lọc theo ngày
                </Typography>
              </Box>

              {/* Date presets — 1-click set khoảng thường dùng */}
              <Box layoutClassName="flex flex-wrap gap-1.5">
                {([
                  { key: 'today', label: 'Hôm nay' },
                  { key: 'last7', label: '7 ngày qua' },
                  { key: 'thisMonth', label: 'Tháng này' },
                  { key: 'last30', label: '30 ngày qua' },
                ] as const).map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    onClick={() => applyDatePreset(p.key)}
                    className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-200"
                   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                    {p.label}
                  </Button>
                ))}
              </Box>

              <Box layoutClassName="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="dateType"
                    value="orderDate"
                    checked={values.dateType === 'orderDate'}
                    onChange={(e) => handleChange('dateType', e.target.value as 'orderDate' | 'deliveryDate')}
                    className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
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
                    className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Typography as="span" size="sm" variant="secondary">
                    {t('orders.deliveryDateLabel')}
                  </Typography>
                </label>
              </Box>

              <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t('orders.fromDate') ?? 'Từ ngày'} htmlFor="order-filters-date-from">
                  <Input
                    id="order-filters-date-from"
                    type="date"
                    value={values.dateFrom}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                    leftIcon={<Calendar />}
                    leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                  />
                </Field>

                <Field label={t('orders.toDate') ?? 'Đến ngày'} htmlFor="order-filters-date-to">
                  <Input
                    id="order-filters-date-to"
                    type="date"
                    value={values.dateTo}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                    leftIcon={<Calendar />}
                    leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                  />
                </Field>
              </Box>

              <Field label="Hoặc chọn tháng" htmlFor="order-filters-month">
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
        </Box>

        <Box
          layoutClassName="flex flex-shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:gap-3"
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
              backgroundClassName="bg-primary-600"
              hoverClassName="hover:bg-primary-700"
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
