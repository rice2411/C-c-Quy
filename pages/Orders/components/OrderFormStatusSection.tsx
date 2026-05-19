import React from 'react';
import { Copy, CreditCard, QrCode, StickyNote, Truck, Store, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DeliveryType, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import Box from '@/components/ui/Box';
import Field from '@/components/ui/Field';
import Image from '@/components/ui/Image';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';

interface OrderStatusSectionProps {
  status: OrderStatus;
  setStatus: (val: OrderStatus) => void;
  paymentStatus: PaymentStatus;
  setPaymentStatus: (val: PaymentStatus) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  note: string;
  setNote: (val: string) => void;
  deliveryType: DeliveryType;
  setDeliveryType: (val: DeliveryType) => void;
  total: number;
  orderNumber: string;
}

const OrderFormStatusSection: React.FC<OrderStatusSectionProps> = ({
  status,
  setStatus,
  paymentStatus,
  setPaymentStatus,
  paymentMethod,
  setPaymentMethod,
  note,
  setNote,
  deliveryType,
  setDeliveryType,
  total,
  orderNumber
}) => {
  const { t } = useLanguage();

  const description = `${orderNumber}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=96247HTTH1308&bank=BIDV&amount=${Math.round(total)}&des=${encodeURIComponent(description)}&template=compact`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box layoutClassName="space-y-6">
      <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.status')} htmlFor="order-form-status">
          <Select
            id="order-form-status"
            fullWidth
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('detail.payment')} htmlFor="order-form-payment-status">
          <Box layoutClassName="relative">
            <CreditCard className="absolute left-3 top-2.5 z-10 h-4 w-4 text-slate-400" />
            <Select
              id="order-form-payment-status"
              fullWidth
              sizeClassName="pl-9"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            >
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Box>
        </Field>
      </Box>

      <Field label={t('paymentMethod.label')} htmlFor="order-form-payment-method">
        <Box layoutClassName="relative">
          <Wallet className="absolute left-3 top-2.5 z-10 h-4 w-4 text-slate-400" />
          <Select
            id="order-form-payment-method"
            fullWidth
            sizeClassName="pl-9"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value={PaymentMethod.CASH}>{t('paymentMethod.cash')}</option>
            <option value={PaymentMethod.BANKING}>{t('paymentMethod.banking')}</option>
          </Select>
        </Box>
      </Field>

      <Field label={t('deliveryType.label')} htmlFor="order-form-delivery-type">
        <Box layoutClassName="grid grid-cols-2 gap-2">
          {([DeliveryType.SHIP, DeliveryType.PICKUP] as DeliveryType[]).map((dt) => {
            const active = deliveryType === dt;
            return (
              <button
                key={dt}
                type="button"
                onClick={() => setDeliveryType(dt)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {dt === DeliveryType.SHIP
                  ? <Truck className="h-4 w-4 shrink-0" />
                  : <Store className="h-4 w-4 shrink-0" />}
                {dt === DeliveryType.SHIP ? t('deliveryType.ship') : t('deliveryType.pickup')}
              </button>
            );
          })}
        </Box>
      </Field>

      <Field label={t('form.note')} htmlFor="order-form-note">
        <Textarea
          id="order-form-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          resize="none"
          placeholder="Special requests, delivery instructions..."
          leftIcon={<StickyNote />}
          leftIconClassName="top-2.5 [&_svg]:h-4 [&_svg]:w-4"
        />
      </Field>

      {/* QR luôn hiện khi total > 0 — không phụ thuộc paymentMethod */}
      {total > 0 ? (
        <Box
          layoutClassName="flex animate-fade-in flex-col items-center gap-4 rounded-xl border p-4 sm:flex-row sm:items-start"
          borderClassName="border-blue-100 dark:border-blue-800"
          backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
        >
          <Box
            layoutClassName="shrink-0 p-2"
            roundedClassName="rounded-lg"
            borderClassName="border border-slate-200"
            backgroundClassName="bg-white"
            shadowClassName="shadow-sm"
          >
            <Image src={qrUrl} alt="Payment QR" layoutClassName="h-32 w-32 object-contain" />
          </Box>

          <Box layoutClassName="w-full flex-1 space-y-2 text-center sm:text-left">
            <Box
              layoutClassName="flex items-center justify-center gap-2 sm:justify-start"
              textClassName="font-semibold text-blue-800 dark:text-blue-300"
            >
              <QrCode className="h-4 w-4" />
              <span>{t('qr.title')}</span>
            </Box>

            <Box layoutClassName="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.bank')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold text-slate-800 dark:text-slate-200">
                  BIDV
                </Typography>
              </Box>
              <Box
                layoutClassName="group flex cursor-pointer items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4"
                onClick={() => copyToClipboard('96247HTTH1308')}
              >
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.account')}
                </Typography>
                <Box layoutClassName="flex items-center gap-2">
                  <Typography as="span" layoutClassName="font-mono font-bold text-slate-800 dark:text-slate-200">
                    96247HTTH1308
                  </Typography>
                  <Copy className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                </Box>
              </Box>
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.accountName')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold uppercase text-slate-800 dark:text-slate-200">
                  TON THAT ANH MINH
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.amount')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold text-orange-600 dark:text-orange-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.content')}
                </Typography>
                <Typography as="span" layoutClassName="break-all font-bold text-slate-800 dark:text-slate-200">
                  {description}
                </Typography>
              </Box>
            </Box>
            <Typography size="xs" variant="muted" layoutClassName="mt-2 text-[10px]">
              {t('qr.instruction')}
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default OrderFormStatusSection;
