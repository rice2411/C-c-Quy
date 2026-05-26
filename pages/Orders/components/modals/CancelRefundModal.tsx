import React, { useState } from 'react';
import { AlertTriangle, Check, RotateCcw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';
import { Order, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { getOrderTotal } from '@/utils/order/orderUtils';

export type CancelRefundMode = 'cancel' | 'refund';

export interface CancelRefundResult {
  /** Đối với mode 'cancel': có hoàn tiền không */
  refund: boolean;
  /** Số tiền hoàn (nếu refund) */
  refundAmount?: number;
  /** Lý do (huỷ hoặc hoàn) */
  reason: string;
}

export interface CancelRefundModalProps {
  open: boolean;
  mode: CancelRefundMode;
  order: Order | null;
  onClose: () => void;
  /** Gọi service — throws nếu fail */
  onConfirm: (result: CancelRefundResult) => Promise<void>;
}

const CancelRefundModal: React.FC<CancelRefundModalProps> = ({
  open,
  mode,
  order,
  onClose,
  onConfirm,
}) => {
  const isCancel = mode === 'cancel';
  const isPaid = order?.paymentStatus === PaymentStatus.PAID;
  const orderTotal = order ? getOrderTotal(order) : 0;

  const [reason, setReason] = useState('');
  const [refund, setRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset khi mở modal
  React.useEffect(() => {
    if (open) {
      setReason('');
      setRefund(isCancel ? false : true); // refund mode: bắt buộc hoàn
      setRefundAmount(isPaid ? String(orderTotal) : '');
      setSubmitting(false);
    }
  }, [open, isCancel, isPaid, orderTotal]);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }
    let amount: number | undefined;
    if (refund) {
      amount = Number(refundAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('Số tiền hoàn không hợp lệ');
        return;
      }
      if (amount > orderTotal) {
        toast.error(`Số tiền hoàn không được vượt quá tổng đơn (${formatVND(orderTotal)})`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onConfirm({ refund, refundAmount: amount, reason: reason.trim() });
      toast.success(isCancel ? 'Đã huỷ đơn' : 'Đã hoàn tiền');
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !order) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={() => !submitting && onClose()}
      title={
        <span className="flex items-center gap-2">
          {isCancel ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Wallet className="h-5 w-5 text-amber-600" />
          )}
          {isCancel ? 'Huỷ đơn hàng' : 'Hoàn tiền'}
        </span>
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
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !reason.trim()}
            leftIcon={submitting ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Check />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            backgroundClassName={isCancel ? 'bg-red-600' : 'bg-amber-600'}
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {submitting
              ? 'Đang xử lý…'
              : isCancel
                ? refund
                  ? 'Huỷ + Hoàn tiền'
                  : 'Xác nhận huỷ'
                : 'Xác nhận hoàn tiền'}
          </Button>
        </>
      }
    >
      <Box layoutClassName="space-y-4">
        {/* Thông tin đơn */}
        <Box
          layoutClassName="rounded-lg border p-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50 dark:bg-slate-800/40"
        >
          <Box layoutClassName="flex items-center justify-between gap-2 text-sm">
            <Box>
              <Typography size="xs" variant="muted">Đơn hàng</Typography>
              <Typography size="sm" layoutClassName="font-semibold">
                {order.orderNumber || order.id}
              </Typography>
            </Box>
            <Box layoutClassName="text-right">
              <Typography size="xs" variant="muted">Tổng tiền</Typography>
              <Typography size="sm" layoutClassName="font-bold text-orange-600">
                {formatVND(orderTotal)}
              </Typography>
            </Box>
          </Box>
          <Typography size="xs" variant="muted" layoutClassName="mt-1.5">
            👤 {order.customer?.name || '(không có)'} · {order.customer?.phone || ''}
          </Typography>
        </Box>

        {/* Cảnh báo */}
        <Box
          layoutClassName="flex items-start gap-2 rounded-lg border p-3"
          borderClassName="border-amber-200 dark:border-amber-800"
          backgroundClassName="bg-amber-50/80 dark:bg-amber-950/40"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <Typography size="xs" textClassName="text-amber-900 dark:text-amber-200">
            {isCancel
              ? 'Đơn sau khi huỷ có thể khôi phục về trạng thái Chờ xử lý, nhưng giao dịch hoàn tiền (nếu có) sẽ vẫn được lưu.'
              : 'Hoàn tiền sẽ ghi nhận paymentStatus = REFUNDED. Thao tác này không tự động chuyển khoản.'}
          </Typography>
        </Box>

        {/* Lý do */}
        <Box>
          <Typography size="xs" layoutClassName="mb-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lý do {isCancel ? 'huỷ đơn' : 'hoàn tiền'} *
          </Typography>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isCancel
                ? 'VD: Khách báo huỷ, sai sản phẩm, hết hàng...'
                : 'VD: Khách yêu cầu hoàn, sản phẩm không đạt chất lượng...'
            }
            rows={3}
          />
        </Box>

        {/* Refund option (only in cancel mode + paid order) */}
        {isCancel && isPaid ? (
          <Box
            layoutClassName="rounded-lg border p-3"
            borderClassName={refund ? 'border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'}
            backgroundClassName={refund ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''}
          >
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={refund}
                onChange={(e) => setRefund(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Box layoutClassName="flex-1">
                <Typography size="sm" layoutClassName="font-semibold">
                  Hoàn tiền cho khách
                </Typography>
                <Typography size="xs" variant="muted" layoutClassName="mt-0.5">
                  Đơn này đã thanh toán {formatVND(orderTotal)}. Đánh dấu hoàn tiền nếu khách đã được hoàn lại.
                </Typography>
              </Box>
            </label>
          </Box>
        ) : null}

        {/* Refund amount */}
        {refund ? (
          <Box>
            <Typography size="xs" layoutClassName="mb-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Số tiền hoàn (VNĐ) *
            </Typography>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0"
            />
            <Box layoutClassName="mt-1.5 flex gap-1 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRefundAmount(String(orderTotal))}
                sizeClassName="px-2 py-1 text-[11px]"
              >
                Hoàn toàn bộ ({formatVND(orderTotal)})
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRefundAmount(String(Math.round(orderTotal * 0.5)))}
                sizeClassName="px-2 py-1 text-[11px]"
              >
                50%
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </BaseModal>
  );
};

export default CancelRefundModal;
