import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';

/** 1 dòng SL bị giảm — dùng hiển thị trong modal xác nhận hoàn. */
export interface RefundLine {
  productName: string;
  /** Số lượng giảm (dương) */
  qtyRefunded: number;
  unitPrice: number;
  /** = qtyRefunded × unitPrice */
  amount: number;
}

export interface RefundConfirmResult {
  amount: number;
  reason: string;
}

export interface RefundConfirmModalProps {
  open: boolean;
  /** Tiền hoàn gợi ý (total cũ − total mới) — prefill ô số tiền */
  suggestedAmount: number;
  /** Trần số tiền hoàn = total cũ (BE cũng validate amount ≤ total cũ) */
  maxAmount: number;
  /** Các dòng SP bị giảm SL */
  lines: RefundLine[];
  onClose: () => void;
  /** Gọi service — throws nếu fail */
  onConfirm: (result: RefundConfirmResult) => Promise<void>;
}

const RefundConfirmModal: React.FC<RefundConfirmModalProps> = ({
  open,
  suggestedAmount,
  maxAmount,
  lines,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(Math.max(0, Math.round(suggestedAmount))));
      setReason('');
      setSubmitting(false);
    }
  }, [open, suggestedAmount]);

  const handleConfirm = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(t('refund.amountInvalid'));
      return;
    }
    if (amt > maxAmount) {
      toast.error(`${t('refund.amountExceed')} (${formatVND(maxAmount)})`);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({ amount: amt, reason: reason.trim() });
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('refund.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={() => !submitting && onClose()}
      title={
        <Typography as="span" layoutClassName="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-600" />
          {t('refund.confirmTitle')}
        </Typography>
      }
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onClose()}
            disabled={submitting}
            sizeClassName="px-4 py-2"
            roundedClassName="rounded-xl"
          >
            {t('form.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            leftIcon={
              submitting ? (
                <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
              ) : (
                <Check />
              )
            }
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            backgroundClassName="bg-amber-600"
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {submitting ? t('refund.processing') : t('refund.confirmCta')}
          </Button>
        </>
      }
    >
      <Box layoutClassName="space-y-4">
        {/* Cảnh báo */}
        <Box
          layoutClassName="flex items-start gap-2 rounded-lg border p-3"
          borderClassName="border-amber-200 dark:border-amber-800"
          backgroundClassName="bg-amber-50/80 dark:bg-amber-950/40"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <Typography size="xs" textClassName="text-amber-900 dark:text-amber-200">
            {t('refund.confirmWarning')}
          </Typography>
        </Box>

        {/* Danh sách dòng giảm SL */}
        <Box>
          <Typography
            size="xs"
            layoutClassName="mb-1.5 font-bold uppercase tracking-wider"
            textClassName="text-slate-500 dark:text-slate-400"
          >
            {t('refund.reducedItems')}
          </Typography>
          <Box
            layoutClassName="space-y-1.5 rounded-lg border p-3"
            borderClassName="border-slate-200 dark:border-slate-700"
            backgroundClassName="bg-slate-50 dark:bg-slate-800/40"
          >
            {lines.map((ln, idx) => (
              <Box
                key={`${ln.productName}-${idx}`}
                layoutClassName="flex items-center justify-between gap-2"
              >
                <Typography size="sm" textClassName="text-slate-700 dark:text-slate-300">
                  {ln.productName}
                  <Typography
                    as="span"
                    size="xs"
                    layoutClassName="ml-1.5"
                    textClassName="text-slate-400 dark:text-slate-500"
                  >
                    −{ln.qtyRefunded} × {formatVND(ln.unitPrice)}
                  </Typography>
                </Typography>
                <Typography
                  size="sm"
                  layoutClassName="shrink-0 font-medium"
                  textClassName="text-slate-900 dark:text-white"
                >
                  {formatVND(ln.amount)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Số tiền hoàn */}
        <Box>
          <Typography
            size="xs"
            layoutClassName="mb-1.5 font-bold uppercase tracking-wider"
            textClassName="text-slate-500 dark:text-slate-400"
          >
            {t('refund.amountLabel')} *
          </Typography>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <Typography size="xs" variant="muted" layoutClassName="mt-1">
            {t('refund.suggestedHint')}: {formatVND(Math.max(0, Math.round(suggestedAmount)))}
          </Typography>
        </Box>

        {/* Lý do */}
        <Box>
          <Typography
            size="xs"
            layoutClassName="mb-1.5 font-bold uppercase tracking-wider"
            textClassName="text-slate-500 dark:text-slate-400"
          >
            {t('refund.reasonLabel')}
          </Typography>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('refund.reasonPlaceholder')}
            rows={3}
          />
        </Box>
      </Box>
    </BaseModal>
  );
};

export default RefundConfirmModal;
