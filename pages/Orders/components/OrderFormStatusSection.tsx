import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, CreditCard, Home, Link2, MonitorSmartphone, QrCode, StickyNote, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { qk } from '@/hooks/queryKeys';
import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';
import { generateQRCodeImage } from '@/utils/order/orderUtils';
import { buildOrderEmvQr } from '@/utils/order/vietQrEmv';
import { pushPosQr, clearPosQr } from '@/services/posService';
import { reconcileOrderTransaction } from '@/services/orderService';
import OrderTxnReconcileModal from '@/pages/Orders/components/modals/OrderTxnReconcileModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Image from '@/components/ui/Image';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Input from '@/components/ui/Input';
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
  total: number;
  orderNumber: string;
  depositAmount: number;
  setDepositAmount: (val: number) => void;
  paidAmount: number;
  setPaidAmount: (val: number) => void;
  /** id đơn (chỉ có khi SỬA đơn) — cần để đối ứng giao dịch. */
  orderId?: string;
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
  total,
  orderNumber,
  depositAmount,
  setDepositAmount,
  paidAmount,
  setPaidAmount,
  orderId,
}) => {
  const { t } = useLanguage();
  const { activeAccount } = usePaymentAccounts();
  const [posBusy, setPosBusy] = useState(false);
  // Chế độ QR đang hiển thị/đẩy POS: 'deposit' (thu cọc) hoặc 'remainder' (gốc trừ cọc).
  const [qrMode, setQrMode] = useState<'deposit' | 'remainder'>('deposit');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const queryClient = useQueryClient();

  // Đối ứng 1 giao dịch (in/out) với đơn: BE cộng/trừ paidAmount + suy status, gắn GD.
  const handleReconcileTxn = async (tx: Transaction) => {
    if (!orderId || reconciling) return;
    setReconciling(true);
    try {
      const updated = await reconcileOrderTransaction(orderId, tx.id);
      setPaidAmount(Number(updated.paidAmount) || 0);
      if (updated.paymentStatus) setPaymentStatus(updated.paymentStatus);
      await queryClient.invalidateQueries({ queryKey: qk.transactions.all });
      const sign = (tx.transferType || 'in') === 'out' ? '−' : '+';
      toast.success(`Đã đối ứng GD #${tx.sepayId} (${sign}${fmt(Number(tx.transferAmount) || 0)})`);
      setPickerOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không đối ứng được giao dịch');
    } finally {
      setReconciling(false);
    }
  };

  const remaining = Math.max(0, total - (Number(paidAmount) || 0)); // còn lại thực = tổng − đã nhận
  const hasDeposit = Number(depositAmount) > 0;
  // Đã thu (để trừ khỏi QR gốc): lớn hơn giữa cọc thoả thuận và tiền đã nhận thực tế.
  const collected = Math.max(Number(depositAmount) || 0, Number(paidAmount) || 0);
  // QR "gốc trừ cọc" = tổng − đã thu (= còn lại).
  const remainderAmount = Math.max(0, total - collected);
  // 2 chế độ QR chuyển đổi qua lại: 'deposit' (thu cọc) / 'remainder' (gốc trừ cọc). Không cọc → luôn remainder.
  const effectiveQrMode: 'deposit' | 'remainder' = hasDeposit ? qrMode : 'remainder';
  const isDepositQr = effectiveQrMode === 'deposit';
  const qrAmount = isDepositQr ? Number(depositAmount) : (remainderAmount > 0 ? remainderAmount : total);
  const qrAmountLabel = !hasDeposit ? '' : (isDepositQr ? t('pos.qrDeposit') : t('pos.qrRemaining'));
  // Nội dung CK = mã đơn đứng một mình; cọc → prefix "C" (vd CORD-000415).
  const description = `${isDepositQr ? 'C' : ''}${orderNumber}`;
  // Không có TK active → qrUrl rỗng → block QR ẩn an toàn. QR khớp số đang chọn (qrAmount) + prefix cọc.
  const qrUrl = activeAccount ? generateQRCodeImage(orderNumber, qrAmount, activeAccount, isDepositQr) : '';
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  // Đẩy QR (chuỗi VietQR EMV) số tiền `amount` xuống thiết bị POS/ESP32.
  const handlePushPos = async (amount: number) => {
    if (!activeAccount || amount <= 0) return;
    const emv = buildOrderEmvQr(orderNumber, amount, activeAccount, isDepositQr);
    if (!emv) {
      toast.error(t('pos.qrBuildFailed'));
      return;
    }
    setPosBusy(true);
    try {
      await pushPosQr({ order_id: orderNumber, amount, qr: emv });
      toast.success(t('pos.qrPushed'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pos.qrPushFailed'));
    } finally {
      setPosBusy(false);
    }
  };

  // Huỷ QR trên thiết bị → ESP32 về màn hình chính.
  const handleCancelPos = async () => {
    setPosBusy(true);
    try {
      await clearPosQr();
      toast.success(t('pos.backToHomeDone'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pos.qrPushFailed'));
    } finally {
      setPosBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box layoutClassName="space-y-6">
      <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.status')} htmlFor="order-form-status">
          <Box>
            <Select
              id="order-form-status"
              fullWidth
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {t(`orders.statusLabels.${s}`)}
                </option>
              ))}
            </Select>
          </Box>
        </Field>

        <Field label={t('detail.payment')} htmlFor="order-form-payment-status">
          <Select
            id="order-form-payment-status"
            fullWidth
            leftIcon={<CreditCard />}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
          >
            {Object.values(PaymentStatus).map((s) => (
              <option key={s} value={s}>
                {t(`orders.paymentStatusLabels.${s}`)}
              </option>
            ))}
          </Select>
        </Field>
      </Box>

      <Field label={t('paymentMethod.label')} htmlFor="order-form-payment-method">
        <Select
          id="order-form-payment-method"
          fullWidth
          leftIcon={<Wallet />}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <option value={PaymentMethod.CASH}>{t('paymentMethod.cash')}</option>
          <option value={PaymentMethod.BANKING}>{t('paymentMethod.banking')}</option>
        </Select>
      </Field>

      <Field label={t('form.deposit')} htmlFor="order-form-deposit">
        <Input
          id="order-form-deposit"
          type="number"
          min={0}
          value={depositAmount || ''}
          onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
          placeholder="0"
          fullWidth
        />
        {depositAmount > 0 || (Number(paidAmount) || 0) > 0 ? (
          <Box layoutClassName="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
            <Typography as="span" size="xs" variant="muted">{t('form.total')}: {fmt(total)}</Typography>
            <Typography as="span" size="xs" variant="muted">{t('form.received')}: {fmt(Number(paidAmount) || 0)}</Typography>
            <Typography as="span" size="xs" layoutClassName="font-semibold text-primary-600 dark:text-primary-400">{t('form.remaining')}: {fmt(remaining)}</Typography>
          </Box>
        ) : null}
        {/* Đối ứng giao dịch — chỉ khi SỬA đơn (đã có orderId) */}
        {orderId ? (
          <Button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={reconciling}
            variant="ghost"
            leftIcon={<Link2 />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
            sizeClassName="mt-2 px-3 py-1.5 text-xs"
            roundedClassName="rounded-lg"
            shadowClassName=""
            borderClassName="border border-dashed border-slate-300 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            textClassName="text-slate-600 dark:text-slate-300"
            hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
            layoutClassName="inline-flex items-center gap-1.5"
          >
            {reconciling ? 'Đang đối ứng…' : 'Đối ứng giao dịch (cọc / thanh toán)'}
          </Button>
        ) : null}
      </Field>

      {/* DeliveryType đã được chuyển lên OrderFormCustomerSection để gần ô địa chỉ */}

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

      {/* QR hiện khi total > 0 VÀ có URL hợp lệ (config đủ số TK/bank) — không phụ thuộc paymentMethod */}
      {total > 0 && qrUrl && activeAccount ? (
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
              <Typography as="span">{t('qr.title')}</Typography>
            </Box>

            <Box layoutClassName="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.bank')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold text-slate-800 dark:text-slate-200">
                  {activeAccount.bankCode}
                </Typography>
              </Box>
              <Box
                layoutClassName="group flex cursor-pointer items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4"
                onClick={() => copyToClipboard(activeAccount.accountNumber)}
              >
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.account')}
                </Typography>
                <Box layoutClassName="flex items-center gap-2">
                  <Typography as="span" layoutClassName="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activeAccount.accountNumber}
                  </Typography>
                  <Copy className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                </Box>
              </Box>
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.accountName')}
                </Typography>
                <Typography as="span" layoutClassName="font-bold uppercase text-slate-800 dark:text-slate-200">
                  {activeAccount.accountHolder}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:justify-start sm:gap-4">
                <Typography as="span" size="xs" layoutClassName="min-w-[60px] font-medium uppercase text-slate-500">
                  {t('qr.amount')}
                </Typography>
                <Box layoutClassName="flex items-center gap-2">
                  <Typography as="span" layoutClassName="font-bold text-primary-600 dark:text-primary-400">
                    {fmt(qrAmount)}
                  </Typography>
                  {qrAmountLabel ? (
                    <Typography as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-semibold" backgroundClassName="bg-amber-100 dark:bg-amber-900/40" textClassName="text-amber-700 dark:text-amber-300">
                      {qrAmountLabel}
                    </Typography>
                  ) : null}
                </Box>
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
            {/* Toggle 2 chế độ QR: thu cọc ↔ gốc trừ cọc (chỉ hiện khi đơn có cọc) */}
            {hasDeposit ? (
              <Box
                layoutClassName="mt-2 inline-flex gap-1 rounded-lg p-1"
                backgroundClassName="bg-slate-100 dark:bg-slate-800"
              >
                <Button
                  type="button"
                  onClick={() => setQrMode('deposit')}
                  variant={effectiveQrMode === 'deposit' ? 'primary' : 'ghost'}
                  sizeClassName="px-3 py-1.5 text-xs"
                  roundedClassName="rounded-md"
                  shadowClassName=""
                  layoutClassName="inline-flex items-center gap-1"
                  disableVariantHover
                >
                  {t('pos.qrDeposit')} · {fmt(Number(depositAmount))}
                </Button>
                <Button
                  type="button"
                  onClick={() => setQrMode('remainder')}
                  variant={effectiveQrMode === 'remainder' ? 'primary' : 'ghost'}
                  sizeClassName="px-3 py-1.5 text-xs"
                  roundedClassName="rounded-md"
                  shadowClassName=""
                  layoutClassName="inline-flex items-center gap-1"
                  disableVariantHover
                >
                  {t('pos.qrRemaining')} · {fmt(remainderAmount)}
                </Button>
              </Box>
            ) : null}
            <Box layoutClassName="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                onClick={() => void handlePushPos(qrAmount)}
                disabled={posBusy || qrAmount <= 0}
                variant="primary"
                leftIcon={<MonitorSmartphone />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-3 py-2 text-xs"
                roundedClassName="rounded-lg"
                layoutClassName="inline-flex w-full items-center justify-center gap-1.5 sm:w-auto"
                disableVariantHover
              >
                {posBusy ? t('pos.qrPushing') : `${t('pos.pushToDevice')} · ${fmt(qrAmount)}`}
              </Button>
              <Button
                type="button"
                onClick={() => void handleCancelPos()}
                disabled={posBusy}
                variant="secondary"
                leftIcon={<Home />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-3 py-2 text-xs"
                roundedClassName="rounded-lg"
                layoutClassName="inline-flex w-full items-center justify-center gap-1.5 sm:w-auto"
                disableVariantHover
              >
                {t('pos.backToHome')}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : null}

      {orderId ? (
        <OrderTxnReconcileModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(tx) => void handleReconcileTxn(tx)}
          busy={reconciling}
        />
      ) : null}
    </Box>
  );
};

export default OrderFormStatusSection;
