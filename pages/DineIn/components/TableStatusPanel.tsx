import React, { useEffect, useState } from 'react';
import { Clock, CreditCard, DoorClosed, Pencil, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { DiningTable, Order, PaymentMethod, PaymentStatus } from '@/types';
import { fetchOrder } from '@/services/orderService';
import { formatVND } from '@/utils/format/currencyUtil';
import OrderItemsMini from '@/pages/Orders/components/OrderItemsMini';
import { fmtTime, fmtDurationClock, useNowTick } from './time';

interface TableStatusPanelProps {
  isOpen: boolean;
  table: DiningTable | null;
  onClose: () => void;
  /** Mở OrderForm để sửa đơn của bàn. */
  onEdit: (order: Order) => void;
  /** Đánh dấu đã thanh toán (giữ bàn mở). */
  onPay: (orderId: string, payload: any) => Promise<void>;
  /** Đóng bàn thủ công (set giờ ra). */
  onCloseTable: (orderId: string) => Promise<void>;
}

const TableStatusPanel: React.FC<TableStatusPanelProps> = ({
  isOpen, table, onClose, onEdit, onPay, onCloseTable,
}) => {
  const now = useNowTick(1000);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const openOrderId = table?.currentOrder?.id ?? null;
  const paid = order?.paymentStatus === PaymentStatus.PAID;

  useEffect(() => {
    if (!isOpen || !openOrderId) return;
    setLoading(true);
    fetchOrder(openOrderId)
      .then(setOrder)
      .catch(() => toast.error('Không tải được đơn của bàn'))
      .finally(() => setLoading(false));
  }, [isOpen, openOrderId]);

  const handlePay = async (method: PaymentMethod) => {
    if (!order) return;
    setSaving(true);
    try {
      await onPay(order.id, {
        customer: order.customer,
        items: (order.items ?? []).map((it) => ({
          id: it.productId ?? it.id, productId: it.productId, name: it.name,
          price: it.price, quantity: it.quantity, image: it.image,
        })),
        status: order.status,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: method,
        paidAmount: order.total,
        tableId: table?.id,
      });
      setOrder((o) => (o ? { ...o, paymentStatus: PaymentStatus.PAID } : o));
      toast.success(`Đã thu ${formatVND(order.total)}`);
    } catch { toast.error('Thanh toán thất bại'); } finally { setSaving(false); }
  };

  const handleClose = async () => {
    if (!order || !table) return;
    if (!paid && !window.confirm('Bàn chưa thanh toán. Vẫn đóng bàn?')) return;
    setSaving(true);
    try {
      await onCloseTable(order.id);
      toast.success(`Đã đóng ${table.name}`);
      onClose();
    } catch { toast.error('Đóng bàn thất bại'); } finally { setSaving(false); }
  };

  if (!table) return null;

  const footer = order ? (
    <Box layoutClassName="flex flex-col gap-2">
      <Button variant="secondary" onClick={() => onEdit(order)} disabled={saving} leftIcon={<Pencil className="w-4 h-4" />}>
        Sửa đơn
      </Button>
      {!paid && (
        <Box layoutClassName="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => handlePay(PaymentMethod.CASH)} disabled={saving} leftIcon={<Wallet className="w-4 h-4" />}>
            Thu tiền mặt
          </Button>
          <Button variant="secondary" onClick={() => handlePay(PaymentMethod.BANKING)} disabled={saving} leftIcon={<CreditCard className="w-4 h-4" />}>
            Thu CK
          </Button>
        </Box>
      )}
      <Button variant="primary" onClick={handleClose} disabled={saving} leftIcon={<DoorClosed className="w-4 h-4" />}>
        Đóng bàn
      </Button>
    </Box>
  ) : undefined;

  return (
    <BaseSlidePanel isOpen={isOpen} onClose={onClose} maxWidth="md"
      title={`${table.name} · Đang ngồi`} footer={footer}>
      {loading || !order ? (
        <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
      ) : (
        <Box layoutClassName="flex flex-col gap-5 p-6">
          {/* Đồng hồ + số khách */}
          <Box layoutClassName="grid grid-cols-2 gap-3">
            <Box layoutClassName="flex flex-col gap-1 p-3"
              backgroundClassName="bg-amber-50 dark:bg-amber-900/20" roundedClassName="rounded-xl">
              <Typography textClassName="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Đã ngồi
              </Typography>
              <Typography textClassName="font-mono text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-200">
                {fmtDurationClock(order.seatedAt, now)}
              </Typography>
              <Typography textClassName="text-xs text-amber-600 dark:text-amber-400">
                Vào lúc {fmtTime(order.seatedAt)}
              </Typography>
            </Box>
            <Box layoutClassName="flex flex-col gap-1 p-3"
              backgroundClassName="bg-slate-50 dark:bg-slate-900/50" roundedClassName="rounded-xl">
              <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Số khách
              </Typography>
              <Typography textClassName="text-xl font-bold text-slate-800 dark:text-slate-100">
                {order.guestCount ?? '—'}
              </Typography>
            </Box>
          </Box>

          {/* Thông tin đơn */}
          <Box layoutClassName="flex flex-col gap-2 p-3"
            backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border border-slate-200 dark:border-slate-700"
            roundedClassName="rounded-xl">
            <Box layoutClassName="flex items-center justify-between">
              <Typography textClassName="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Đơn {order.orderNumber ?? ''}
              </Typography>
              <Badge size="sm"
                backgroundClassName={paid ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}
                textClassName={paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
                borderClassName={paid ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-600'}>
                {paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Badge>
            </Box>
            <OrderItemsMini items={order.items ?? []} />
            <Box layoutClassName="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
              <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">Tổng</Typography>
              <Typography textClassName="text-lg font-bold text-slate-900 dark:text-white">{formatVND(order.total ?? 0)}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </BaseSlidePanel>
  );
};

export default TableStatusPanel;
