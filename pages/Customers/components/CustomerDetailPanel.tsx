import React, { useState, useEffect } from 'react';
import { Mail, Package, Phone, User } from 'lucide-react';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import PhoneCarrierBadge from './PhoneCarrierBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer, Order } from '@/types';
import { PaymentStatus } from '@/types/enums';
import { formatDateOnly, formatDateTime } from '@/utils/format/dateUtil';
import { formatVND } from '@/utils/format/currencyUtil';
import { getOrderTotal } from '@/utils/order/orderUtils';

interface CustomerDetailPanelProps {
  customer: Customer;
  orders: Order[];
  onClose: () => void;
  onSavePhone?: (customerId: string, phone: string) => void | Promise<void>;
}

const lineAmount = (price: number, qty: number) => Number(price) * Number(qty);

const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  orders,
  onClose,
  onSavePhone,
}) => {
  const { t } = useLanguage();
  const [phoneDraft, setPhoneDraft] = useState(customer.phone ?? '');

  useEffect(() => {
    setPhoneDraft(customer.phone ?? '');
  }, [customer.id, customer.phone]);

  const statusLabel = (status: string) => t(`orders.statusLabels.${status}`) || status;
  const paymentLabel = (ps: string) => t(`orders.paymentStatusLabels.${ps}`) || ps;
  /** Cùng key với OrderForm / OrderList: `paymentMethod.cash` (root), không dùng `orders.paymentMethod` */
  const paymentMethodLabel = (pm: string | undefined) => {
    if (!pm) return '—';
    const k = String(pm).toLowerCase();
    return t(`paymentMethod.${k}`) || pm;
  };

  const handlePhoneBlur = () => {
    const next = phoneDraft.trim();
    const prev = (customer.phone ?? '').trim();
    if (next === prev) return;
    onSavePhone?.(customer.id, next);
  };

  const paymentRecordedAt = (order: Order) => {
    if (order.paymentStatus !== PaymentStatus.PAID) return null;
    return formatDateTime(order.updatedAt ?? order.orderDate ?? order.date);
  };

  const cardShell =
    'rounded-xl border border-slate-100 p-4 sm:p-5 dark:border-slate-700';
  const cardBg = 'bg-slate-50 dark:bg-slate-700/30';

  return (
    <BaseSlidePanel isOpen onClose={onClose} maxWidth="2xl" title={customer.name}>
      <Box layoutClassName="space-y-6 p-6">
        <Box>
          <Heading
            level={3}
            layoutClassName="mb-3 flex items-center gap-2 uppercase tracking-wider"
            textClassName="text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            <User className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
            {t('customers.detail.contactSection')}
          </Heading>

          <Box layoutClassName={`${cardShell} ${cardBg}`}>
            <Box layoutClassName="flex flex-wrap gap-6">
              <Box layoutClassName="flex min-w-0 items-start gap-3">
                <Box
                  layoutClassName="flex h-12 w-12 shrink-0 items-center justify-center text-lg font-bold shadow-sm"
                  roundedClassName="rounded-full"
                  backgroundClassName="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/45 dark:to-amber-900/25"
                  textClassName="text-orange-700 dark:text-orange-300"
                >
                  {customer.name.charAt(0).toUpperCase()}
                </Box>
                <Box layoutClassName="min-w-0">
                  <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                    {customer.name}
                  </Typography>
                  <Typography size="xs" variant="muted" layoutClassName="mt-0.5 font-mono">
                    ID {customer.id}
                  </Typography>
                </Box>
              </Box>

              <Box layoutClassName="flex min-w-[min(100%,18rem)] flex-1 flex-col gap-3">
                <Box layoutClassName="flex flex-wrap items-center gap-2">
                  <Input
                    type="tel"
                    size="sm"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder={t('customers.phonePlaceholder')}
                    leftIcon={<Phone className="h-4 w-4 text-orange-500" />}
                    leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
                    containerClassName="min-w-0 flex-1 sm:max-w-xs"
                    borderClassName={
                      !phoneDraft.trim()
                        ? 'border-dashed border-slate-300 dark:border-slate-600'
                        : 'border-slate-200 dark:border-slate-600'
                    }
                    backgroundClassName="bg-white dark:bg-slate-800"
                  />
                  {!phoneDraft.trim() ? (
                    <Badge
                      size="sm"
                      layoutClassName="shrink-0"
                      borderClassName="border border-slate-300/80 dark:border-slate-600"
                      backgroundClassName="bg-white dark:bg-slate-800/90"
                      textClassName="text-[11px] font-medium text-slate-600 dark:text-slate-300"
                    >
                      {t('customers.phoneEmptyBadge')}
                    </Badge>
                  ) : (
                    <PhoneCarrierBadge phone={phoneDraft} />
                  )}
                </Box>
              </Box>

              {customer.email ? (
                <Box layoutClassName="flex min-w-0 flex-1 basis-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 sm:basis-auto">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <Typography as="span" layoutClassName="truncate text-sm text-slate-700 dark:text-slate-200">
                    {customer.email}
                  </Typography>
                </Box>
              ) : null}
            </Box>

            {(customer.address || customer.city || customer.country) && (
              <Box layoutClassName="mt-4 border-t border-slate-200/90 pt-4 dark:border-slate-600">
                <Typography size="xs" variant="muted" layoutClassName="mb-1 font-medium uppercase tracking-wide">
                  {t('customers.form.address')}
                </Typography>
                <Typography size="sm" layoutClassName="text-slate-700 dark:text-slate-200">
                  {[customer.address, customer.city, customer.country].filter(Boolean).join(' · ') || '—'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box>
          <Heading
            level={3}
            layoutClassName="mb-3 flex items-center gap-2 uppercase tracking-wider"
            textClassName="text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            <Package className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
            {t('customers.detail.ordersHeading').replace('{{n}}', String(orders.length))}
          </Heading>

          {orders.length === 0 ? (
            <Box
              layoutClassName={`${cardShell} border-dashed bg-transparent px-4 py-12 text-center dark:border-slate-600`}
            >
              <Typography size="sm" variant="muted" layoutClassName="leading-relaxed">
                {t('customers.detail.noOrders')}
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="flex max-h-[min(62vh,540px)] flex-col gap-4 overflow-y-auto pr-1">
              {orders.map((order) => {
                const items = order.items ?? [];
                const subtotal = items.reduce((s, i) => s + lineAmount(i.price, i.quantity), 0);
                const shipping = Number(order.shippingCost ?? 0);
                const grandTotal = getOrderTotal(order);
                const paidAt = paymentRecordedAt(order);

                return (
                  <Box key={order.id} layoutClassName={`${cardShell} ${cardBg}`}>
                    <Box layoutClassName="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-slate-600">
                      <Box layoutClassName="min-w-0">
                        <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                          {order.orderNumber || `#${order.id.slice(0, 8)}`}
                        </Typography>
                        <Typography size="xs" variant="muted" layoutClassName="mt-1">
                          {t('orders.tableDate')}: {formatDateOnly(order.orderDate || order.date)}
                        </Typography>
                      </Box>
                      <Box layoutClassName="flex flex-wrap gap-2">
                        <Badge
                          size="sm"
                          layoutClassName="rounded-full px-2.5 py-0.5"
                          borderClassName="border border-slate-200/80 dark:border-slate-600"
                          backgroundClassName="bg-white/90 dark:bg-slate-800/80"
                          textClassName="text-[11px] font-medium text-slate-700 dark:text-slate-200"
                        >
                          {statusLabel(order.status)}
                        </Badge>
                        <Badge
                          size="sm"
                          layoutClassName="rounded-full px-2.5 py-0.5"
                          borderClassName="border border-slate-200/80 dark:border-slate-600"
                          backgroundClassName="bg-white/90 dark:bg-slate-800/80"
                          textClassName="text-[11px] font-medium text-slate-700 dark:text-slate-200"
                        >
                          {paymentLabel(order.paymentStatus)}
                        </Badge>
                      </Box>
                    </Box>

                    <Heading
                      level={4}
                      layoutClassName="mb-2 mt-4 uppercase tracking-wide"
                      textClassName="text-xs font-semibold text-slate-500 dark:text-slate-400"
                    >
                      {t('detail.items')}
                    </Heading>
                    <Box layoutClassName="space-y-2">
                      {items.length === 0 ? (
                        <Typography size="sm" variant="muted">
                          —
                        </Typography>
                      ) : (
                        items.map((item) => (
                          <Box
                            key={item.id}
                            layoutClassName="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100/90 pb-2 last:border-0 last:pb-0 dark:border-slate-600/80"
                          >
                            <Typography as="span" layoutClassName="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                              {item.name}{' '}
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">× {item.quantity}</span>
                            </Typography>
                            <Typography
                              as="span"
                              layoutClassName="shrink-0 tabular-nums text-sm font-medium text-slate-900 dark:text-white"
                            >
                              {formatVND(lineAmount(item.price, item.quantity))}
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Box>

                    <Box layoutClassName="mt-4 space-y-2 border-t border-slate-200/90 pt-4 dark:border-slate-600">
                      <Box layoutClassName="flex justify-between gap-3 text-sm">
                        <Typography variant="muted">{t('detail.subtotal')}</Typography>
                        <Typography layoutClassName="tabular-nums text-slate-800 dark:text-slate-100">{formatVND(subtotal)}</Typography>
                      </Box>
                      <Box layoutClassName="flex justify-between gap-3 text-sm">
                        <Typography variant="muted">{t('detail.shipping')}</Typography>
                        <Typography layoutClassName="tabular-nums text-slate-800 dark:text-slate-100">{formatVND(shipping)}</Typography>
                      </Box>
                      <Box layoutClassName="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-600">
                        <Typography layoutClassName="text-base font-semibold text-slate-900 dark:text-white">{t('detail.total')}</Typography>
                        <Typography layoutClassName="text-base font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                          {formatVND(grandTotal)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box layoutClassName="mt-4 grid gap-4 border-t border-slate-200/90 pt-4 text-sm dark:border-slate-600 sm:grid-cols-2">
                      <Box>
                        <Typography size="xs" variant="muted" layoutClassName="mb-1 font-medium">
                          {t('detail.paymentMethod')}
                        </Typography>
                        <Typography layoutClassName="font-medium text-slate-900 dark:text-white">
                          {paymentMethodLabel(order.paymentMethod)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography size="xs" variant="muted" layoutClassName="mb-1 font-medium">
                          {t('customers.detail.paymentDateLabel')}
                        </Typography>
                        {order.paymentStatus === PaymentStatus.PAID && paidAt ? (
                          <>
                            <Typography layoutClassName="font-medium text-slate-900 dark:text-white">{paidAt}</Typography>
                            <Typography size="xs" variant="muted" layoutClassName="mt-1.5 leading-relaxed">
                              {t('customers.detail.paymentAtHint')}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="muted">{t('customers.detail.paymentPending')}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </BaseSlidePanel>
  );
};

export default CustomerDetailPanel;
