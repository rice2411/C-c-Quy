/**
 * OrderFiltersPanel — panel lọc nâng cao INLINE (thay modal), lưới field có nhãn
 * kiểu SPX. Sửa trên bản nháp, bấm "Tìm kiếm" mới áp; "Đặt lại" xoá; "Thu gọn" đóng.
 * Trạng thái đơn đã có tab riêng nên KHÔNG lặp ở đây; từ khoá dùng ô search toolbar.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PaymentStatus } from '@/types';
import { CARRIER_STATUS_OPTIONS } from '@/pages/Orders/carrierStatus';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import type { OrderFiltersState, SortFieldKey } from '@/pages/Orders/components/modals/OrderFiltersModal';

interface Props {
  initialValues: OrderFiltersState;
  creatorOptions: string[];
  onApply: (values: OrderFiltersState) => void;
  onCollapse: () => void;
}

const SORT_FIELD_OPTIONS: { value: SortFieldKey; label: string }[] = [
  { value: 'date', label: 'Ngày tạo' },
  { value: 'deliveryDate', label: 'Ngày giao (gấp nhất)' },
  { value: 'total', label: 'Tổng tiền' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'orderNumber', label: 'Mã đơn' },
];

// Field trắng đồng bộ với DatePicker (viền slate-300) — nổi trên nền panel slate-50.
const FIELD_BG = 'bg-white dark:bg-slate-800';
const FIELD_BORDER = 'border border-slate-300 dark:border-slate-600';

/** Select đồng bộ màu field. */
const PSelect: React.FC<React.ComponentProps<typeof Select>> = (p) => (
  <Select {...p} backgroundClassName={FIELD_BG} borderClassName={FIELD_BORDER} />
);
/** Input đồng bộ màu field. */
const PInput: React.FC<React.ComponentProps<typeof Input>> = (p) => (
  <Input {...p} backgroundClassName={FIELD_BG} borderClassName={FIELD_BORDER} />
);

const OrderFiltersPanel: React.FC<Props> = ({ initialValues, creatorOptions, onApply, onCollapse }) => {
  const { t, language } = useLanguage();
  const [values, setValues] = useState<OrderFiltersState>(initialValues);

  // Đồng bộ nháp khi filter ngoài đổi (vd xoá filter).
  useEffect(() => { setValues(initialValues); }, [initialValues]);

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const start = new Date(2025, 0, 1);
    const now = new Date();
    const current = new Date(start);
    let i = 0;
    while (i < 120) {
      const y = current.getFullYear();
      const m = current.getMonth();
      if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) break;
      opts.push({
        value: `${y}-${String(m + 1).padStart(2, '0')}`,
        label: current.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }),
      });
      current.setMonth(m + 1);
      i++;
    }
    return opts.reverse();
  }, [language]);

  const set = (key: keyof OrderFiltersState, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value as any }));

  const handleReset = () => {
    const d: OrderFiltersState = {
      searchTerm: values.searchTerm,
      statusFilter: values.statusFilter,
      productFilter: '', selectedMonth: '', paymentStatusFilter: 'All', paymentMethodFilter: 'All',
      creatorFilter: '', trackingStatusFilter: 'All', dateFrom: '', dateTo: '', dateType: 'orderDate',
      sortField: 'date', sortDirection: 'desc', hideCompleted: false,
    };
    setValues(d);
    onApply(d);
  };

  return (
    <Box
      layoutClassName="flex shrink-0 flex-col gap-4 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-slate-50/70 dark:bg-slate-800/30"
    >
      <Box layoutClassName="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tên sản phẩm" htmlFor="ofp-product">
          <PInput id="ofp-product" value={values.productFilter} placeholder="VD: matcha, combo…"
            onChange={(e) => set('productFilter', e.target.value)} />
        </Field>

        <Field label="Người tạo đơn" htmlFor="ofp-creator">
          <PSelect id="ofp-creator" value={values.creatorFilter} onChange={(e) => set('creatorFilter', e.target.value)}>
            <option value="">Tất cả</option>
            {creatorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </PSelect>
        </Field>

        <Field label="Tình trạng thanh toán" htmlFor="ofp-paystatus">
          <PSelect id="ofp-paystatus" value={values.paymentStatusFilter} onChange={(e) => set('paymentStatusFilter', e.target.value)}>
            <option value="All">Tất cả</option>
            {Object.values(PaymentStatus).map((s) => <option key={s} value={s}>{t(`orders.paymentStatusLabels.${s}`)}</option>)}
          </PSelect>
        </Field>

        <Field label="Phương thức thanh toán" htmlFor="ofp-paymethod">
          <PSelect id="ofp-paymethod" value={values.paymentMethodFilter} onChange={(e) => set('paymentMethodFilter', e.target.value)}>
            <option value="All">Tất cả</option>
            <option value="CASH">{t('paymentMethod.cash')}</option>
            <option value="BANKING">{t('paymentMethod.banking')}</option>
          </PSelect>
        </Field>

        <Field label="Trạng thái vận chuyển (ĐVVC)" htmlFor="ofp-tracking">
          <PSelect id="ofp-tracking" value={values.trackingStatusFilter} onChange={(e) => set('trackingStatusFilter', e.target.value)}>
            {CARRIER_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </PSelect>
        </Field>

        <Field label="Lọc theo" htmlFor="ofp-datetype">
          <PSelect id="ofp-datetype" value={values.dateType} onChange={(e) => set('dateType', e.target.value)}>
            <option value="orderDate">{t('orders.orderDateLabel')}</option>
            <option value="deliveryDate">{t('orders.deliveryDateLabel')}</option>
          </PSelect>
        </Field>

        <Field label={t('orders.fromDate') ?? 'Từ ngày'} htmlFor="ofp-from">
          <DatePicker id="ofp-from" value={values.dateFrom} onChange={(v) => set('dateFrom', v)} fullWidth />
        </Field>

        <Field label={t('orders.toDate') ?? 'Đến ngày'} htmlFor="ofp-to">
          <DatePicker id="ofp-to" value={values.dateTo} onChange={(v) => set('dateTo', v)} fullWidth />
        </Field>

        <Field label="Hoặc chọn tháng" htmlFor="ofp-month">
          <PSelect id="ofp-month" value={values.selectedMonth} onChange={(e) => set('selectedMonth', e.target.value)}>
            <option value="">{t('orders.allMonths')}</option>
            {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </PSelect>
        </Field>

        <Field label="Sắp xếp theo" htmlFor="ofp-sort">
          <PSelect id="ofp-sort" value={values.sortField} onChange={(e) => set('sortField', e.target.value)}>
            {SORT_FIELD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </PSelect>
        </Field>

        <Field label="Hướng sắp xếp" htmlFor="ofp-dir">
          <PSelect id="ofp-dir" value={values.sortDirection} onChange={(e) => set('sortDirection', e.target.value)}>
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </PSelect>
        </Field>
      </Box>

      <Box layoutClassName="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          onClick={() => onApply(values)}
          leftIcon={<Search />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-primary-600"
          hoverClassName="hover:bg-primary-700"
          textClassName="font-semibold text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm shadow-primary-200 dark:shadow-none"
          sizeClassName="px-5 py-2 text-sm"
          layoutClassName="inline-flex items-center gap-1.5"
          stateClassName="transition-colors"
          variant="primary"
          disableVariantHover
          disableVariantTextColor
        >
          Tìm kiếm
        </Button>
        <Button
          type="button"
          onClick={handleReset}
          leftIcon={<RotateCcw />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border border-slate-300 dark:border-slate-600"
          hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
          textClassName="font-medium text-slate-600 dark:text-slate-300"
          roundedClassName="rounded-lg"
          sizeClassName="px-4 py-2 text-sm"
          layoutClassName="inline-flex items-center gap-1.5"
          stateClassName="transition-colors"
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
        >
          Đặt lại
        </Button>
        <Button
          type="button"
          onClick={onCollapse}
          rightIcon={<ChevronUp />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-transparent"
          textClassName="font-semibold text-primary-600 dark:text-primary-400"
          roundedClassName="rounded-lg"
          sizeClassName="px-3 py-2 text-sm"
          layoutClassName="inline-flex items-center gap-1"
          stateClassName="transition-colors"
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
        >
          Thu gọn
        </Button>
      </Box>
    </Box>
  );
};

export default OrderFiltersPanel;
