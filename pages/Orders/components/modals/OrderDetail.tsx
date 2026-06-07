import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Copy,
  CreditCard,
  FileText,
  Globe,
  History,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Receipt,
  StickyNote,
  Store,
  Trash2,
  Truck,
  User,
  Wallet,
  X
} from 'lucide-react';
import { STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { ORDER_EDIT_DENIED } from '@/services/orderService';
import { fetchTransactionsByOrderNumber } from '@/services/transactionService';
import { DeliveryType, Order, OrderItem, PaymentMethod, OrderStatus, PaymentStatus, Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { generateQRCodeImage, getOrderTotal } from '@/utils/order/orderUtils';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import CancelRefundModal, { type CancelRefundMode, type CancelRefundResult } from '@/pages/Orders/components/modals/CancelRefundModal';
interface OrderDetailProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  /** CTV chỉ được sửa đơn do họ tạo; false => ẩn chỉnh nhanh trạng thái / thanh toán */
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  onUpdateOrder?: (id: string, data: Partial<Order>) => Promise<void>;
}

const OrderDetail: React.FC<OrderDetailProps> = ({
  isOpen,
  order,
  onClose,
  canEdit = true,
  onEdit,
  onDelete,
  canDelete = false,
  onUpdateOrder,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [crMode, setCrMode] = useState<CancelRefundMode | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);
  // Transactions của đơn hiện tại — load lazy khi panel mở. Mỗi transaction
  // sẽ render thành 1 entry trong block "Lịch sử nhận tiền".
  const [relatedTransactions, setRelatedTransactions] = useState<Transaction[]>([]);

  React.useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!order?.orderNumber) {
        setRelatedTransactions([]);
        return;
      }
      const txs = await fetchTransactionsByOrderNumber(order.orderNumber);
      if (!cancelled) {
        setRelatedTransactions(txs);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [order?.orderNumber, order?.paymentStatus, order?.sepayId]);

  const currentOrder = localOrder || order;
  if (!currentOrder) return null;

  const calculateLineItemTotal = (item: OrderItem) => {
    return item.price * item.quantity;
  };

  const shippingCost = currentOrder.shippingCost || 0;
  
  const subtotal = currentOrder.items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
  
  const finalTotal = getOrderTotal(currentOrder);

  const description = `${currentOrder.orderNumber}`;
  const qrUrl =generateQRCodeImage(description, finalTotal);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /**
   * Map (entry, field) -> category. 3 block:
   * - status: chuyển trạng thái đơn (PENDING/PROCESSING/DELIVERED…)
   * - payment: CHỈ ghi nhận tự động từ SePay (entry.byUid === 'system')
   *            → đây là thời điểm hệ thống nhận tiền thật
   * - info: mọi thay đổi do người chỉnh (kể cả paymentStatus / paymentMethod /
   *         total / shippingCost / items / customer / note / delivery)
   */
  const changeToCategory = (entry: any, field: string): 'status' | 'payment' | 'info' => {
    if (field === 'status') return 'status';
    if (entry?.byUid === 'system') return 'payment';
    return 'info';
  };

  const formatHistoryValue = (field: string, value: any): string => {
    if (value === null || value === undefined || value === '' || value === '—') return '—';
    const s = String(value);
    if (field === 'status' && ['PENDING','PROCESSING','DELIVERED','CANCELLED','RETURNED'].includes(s)) {
      return t(`orders.statusLabels.${s}`);
    }
    if (field === 'paymentStatus' && ['PAID','UNPAID','REFUNDED'].includes(s)) {
      return t(`orders.paymentStatusLabels.${s}`);
    }
    if (field === 'paymentMethod') {
      if (s === 'BANKING') return t('paymentMethod.banking');
      if (s === 'CASH') return t('paymentMethod.cash');
    }
    if (field === 'deliveryType') {
      if (s === 'SHIP') return t('deliveryType.ship');
      if (s === 'PICKUP') return t('deliveryType.pickup');
      if (s === 'SHIP_PROVINCE') return t('deliveryType.shipProvince');
    }
    if (field === 'total' || field === 'shippingCost') {
      const n = Number(value);
      if (!isNaN(n)) return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    }
    return s;
  };

  const handleCancelRefund = async (result: CancelRefundResult) => {
    if (!currentOrder?.id || !onUpdateOrder) throw new Error('Không thể cập nhật đơn');
    const isCancel = crMode === 'cancel';
    const nowIso = new Date().toISOString();
    const patch: Partial<Order> = {};
    if (isCancel) {
      patch.status = OrderStatus.CANCELLED;
      patch.cancelReason = result.reason;
      patch.cancelledAt = nowIso;
    } else {
      patch.refundReason = result.reason;
    }
    if (result.refund && result.refundAmount) {
      patch.paymentStatus = PaymentStatus.REFUNDED;
      patch.refundedAt = nowIso;
      patch.refundedAmount = result.refundAmount;
      patch.refundReason = patch.refundReason || result.reason;
    }
    await onUpdateOrder(currentOrder.id, { ...currentOrder, ...patch });
  };

  const handleUpdateField = async (patch: Partial<Order>, setLoading: (v: boolean) => void) => {
    if (!canEdit || !currentOrder?.id || !onUpdateOrder) return;
    setLoading(true);
    try {
      await onUpdateOrder(currentOrder.id, { ...currentOrder, ...patch });
      // KHONG can setLocalOrder optimistic nua — parent da auto-sync selectedOrder
      // qua useEffect khi orders list refresh, va useEffect([order]) cua component
      // se reset localOrder = order moi (kem history moi).
      setIsStatusOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ORDER_EDIT_DENIED) {
        toast.error(t('orders.editDeniedCollaborator'));
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const headerContent = (
    <Box layoutClassName="flex w-full items-start justify-between">
      <Box>
        <Box layoutClassName="mb-1 flex items-center gap-3">
          <Heading level={2} textClassName="text-xl font-bold">
            {currentOrder.orderNumber || `Order #${currentOrder.id}`}
          </Heading>
          <Badge
            size="sm"
            layoutClassName="px-2.5 py-0.5 text-xs font-medium"
            className={STATUS_COLORS[currentOrder.status]}
          >
            {currentOrder.status}
          </Badge>
        </Box>
        <Typography size="sm" variant="muted">
          {t('detail.placedOn')} {new Date(currentOrder.createdAt.toDate()).toLocaleString()}
        </Typography>
        {currentOrder.deliveryDate ? (
          <Typography size="sm" variant="muted">
            Ngày nhận hàng: {new Date(currentOrder.deliveryDate).toLocaleDateString()}
            {currentOrder.deliveryTime ? ` • ${currentOrder.deliveryTime}` : ''}
          </Typography>
        ) : null}
      </Box>
      <IconButton
        type="button"
        label={t('detail.close')}
        variant="secondary"
        layoutClassName="rounded-full"
        backgroundClassName="bg-slate-50 dark:bg-slate-700"
        hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-600"
        textClassName="text-slate-400 dark:text-slate-300"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </IconButton>
    </Box>
  );

  const footer = (
    <Box layoutClassName="flex justify-end gap-3">
      <Button
        type="button"
        onClick={onClose}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-transparent"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
        textClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
        roundedClassName="rounded-lg"
        layoutClassName="px-4 py-2"
        stateClassName="transition-colors"
      >
        {t('detail.close')}
      </Button>
      {onEdit ? (
        <Button
          type="button"
          onClick={onEdit}
          backgroundClassName="bg-orange-600 dark:bg-orange-500"
          hoverClassName="hover:bg-orange-700 dark:hover:bg-orange-600"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
          layoutClassName="px-4 py-2"
          stateClassName="transition-colors"
          variant="primary"
          disableVariantHover
          disableVariantTextColor
        >
          {t('detail.edit')}
        </Button>
      ) : null}
      {canDelete && onDelete ? (
        <Button
          type="button"
          onClick={onDelete}
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
          borderClassName="border border-red-200 dark:border-red-700/50"
          backgroundClassName="bg-red-50 dark:bg-red-900/20"
          hoverClassName="hover:bg-red-100 dark:hover:bg-red-900/30"
          textClassName="text-sm font-medium text-red-700 dark:text-red-300"
          roundedClassName="rounded-lg"
          layoutClassName="px-4 py-2"
          stateClassName="transition-colors"
          leftIcon={<Trash2 className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        >
          {t('orders.delete')}
        </Button>
      ) : null}
    </Box>
  );

  return (
    <>
    <BaseSlidePanel
      isOpen={isOpen && !!order}
      onClose={onClose}
      maxWidth="2xl"
      headerContent={headerContent}
      footer={footer}
    >
      <div className="flex flex-col h-full">
        <Box
          layoutClassName="flex space-x-6 border-b border-slate-100 bg-white px-6 dark:border-slate-700 dark:bg-slate-800"
          stateClassName="transition-colors"
        >
          <Button
            type="button"
            onClick={() => setActiveTab('details')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName={
              activeTab === 'details' ? 'border-b-2 border-orange-600' : 'border-b-2 border-transparent'
            }
            textClassName={
              activeTab === 'details'
                ? 'text-sm font-medium text-orange-600 dark:text-orange-400'
                : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }
            layoutClassName="rounded-none py-4 shadow-none"
            stateClassName="transition-colors"
          >
            {t('detail.tabDetails')}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('history')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName={
              activeTab === 'history' ? 'border-b-2 border-sky-600' : 'border-b-2 border-transparent'
            }
            textClassName={
              activeTab === 'history'
                ? 'text-sm font-medium text-sky-600 dark:text-sky-400'
                : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }
            layoutClassName="flex items-center gap-2 rounded-none py-4 shadow-none"
            stateClassName="transition-colors"
            leftIcon={<History className="h-4 w-4" />}
          >
            {t('detail.tabHistory')}
            {(() => {
              // Tổng số dòng lịch sử = sum(changes) trong order.history + số transactions ghi nhận
              const historyChangesCount = Array.isArray(currentOrder.history)
                ? currentOrder.history.reduce(
                    (sum: number, entry: any) => sum + (Array.isArray(entry?.changes) ? entry.changes.length : 0),
                    0,
                  )
                : 0;
              const total = historyChangesCount + relatedTransactions.length;
              return total > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  {total}
                </span>
              ) : null;
            })()}
          </Button>
        </Box>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 transition-colors">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.customer')}</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {currentOrder.customer.name && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-slate-900 dark:text-white">{t('detail.customerName')}</p>
                            <p className="text-slate-600 dark:text-slate-300">{currentOrder.customer.name}</p>
                          </div>
                        </div>
                      )}
                      {currentOrder.customer.email && (
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                             <Mail className="w-4 h-4" />
                           </div>
                           <div className="text-sm">
                             <p className="font-medium text-slate-900 dark:text-white">{t('detail.email')}</p>
                             <span className="text-slate-600 dark:text-slate-300">{currentOrder.customer.email}</span>
                           </div>
                        </div>
                      )}
                      {currentOrder.customer.phone && (
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                             <Phone className="w-4 h-4" />
                           </div>
                           <div className="text-sm">
                             <p className="font-medium text-slate-900 dark:text-white">{t('detail.phone')}</p>
                             <span className="text-slate-600 dark:text-slate-300">{currentOrder.customer.phone}</span>
                           </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{t('detail.shippingAddress')}</p>
                        <p className="text-slate-500 dark:text-slate-400">{currentOrder.customer.address || 'No address provided'}</p>
                        {currentOrder.customer.city && <p className="text-slate-500 dark:text-slate-400">{currentOrder.customer.city}, {currentOrder.customer.country}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note Section - Separate card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    {t('detail.note')}
                  </Heading>
                  {currentOrder.note ? (
                    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {currentOrder.note}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                        {t('detail.noNote') || 'No note provided'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.items')}</Heading>
                   <div className="space-y-4">
                     {currentOrder.items.map((item) => (
                       <div key={item.id} className="flex items-center gap-4 py-2">
                         <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                         <div className="flex-1">
                           <Heading level={4} textClassName="text-sm font-medium text-slate-900 dark:text-white">{item.name}</Heading>
                           <p className="text-xs text-slate-500 dark:text-slate-400">ID: {item.id}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium text-slate-900 dark:text-white">{formatVND(calculateLineItemTotal(item))}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                         </div>
                       </div>
                     ))}
                   </div>

                   {currentOrder.decorations && currentOrder.decorations.length > 0 ? (
                     <Box layoutClassName="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                       <Typography as="p" size="xs" layoutClassName="mb-2 font-semibold uppercase tracking-wide" textClassName="text-slate-400 dark:text-slate-500">Trang trí thêm</Typography>
                       <Box layoutClassName="space-y-1.5">
                         {currentOrder.decorations.map((d, idx) => (
                           <Box key={`${d.materialId}-${idx}`} layoutClassName="flex items-center justify-between gap-2">
                             <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-300">{d.quantity}× {d.name}</Typography>
                             <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{formatVND(d.price * d.quantity)}</Typography>
                           </Box>
                         ))}
                       </Box>
                     </Box>
                   ) : null}

                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.subtotal')}</span>
                       <span>{formatVND(subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.shipping')}</span>
                       <span>{formatVND(shippingCost)}</span>
                     </div>
                     {currentOrder.decorations && currentOrder.decorations.length > 0 ? (
                       <Box layoutClassName="flex items-center justify-between" textClassName="text-sm text-slate-500 dark:text-slate-400">
                         <Typography as="span" size="sm">Trang trí</Typography>
                         <Typography as="span" size="sm">{formatVND(currentOrder.decorations.reduce((s, d) => s + d.price * d.quantity, 0))}</Typography>
                       </Box>
                     ) : null}
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                       <span className="font-medium text-slate-900 dark:text-white">{t('detail.total')}</span>
                       <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatVND(finalTotal)}</span>
                     </div>
                   </div>
                </div>

                {/* STATUS STEPPER CARD */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    {t('orders.tableStatus')}
                  </Heading>

                  {currentOrder.status === OrderStatus.CANCELLED || currentOrder.status === OrderStatus.RETURNED ? (
                    /* Terminal state banner */
                    <div className={`flex flex-col items-center gap-3 rounded-xl border p-5 ${
                      currentOrder.status === OrderStatus.CANCELLED
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    }`}>
                      <span className={`text-base font-bold ${
                        currentOrder.status === OrderStatus.CANCELLED
                          ? 'text-red-700 dark:text-red-200'
                          : 'text-orange-700 dark:text-orange-200'
                      }`}>
                        {t(`orders.statusLabels.${currentOrder.status}`)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        {currentOrder.status === OrderStatus.CANCELLED
                          ? 'Đơn này đã bị huỷ. Bấm "Khôi phục" để đưa về trạng thái Chờ xử lý.'
                          : 'Đơn này đã được trả hàng. Bấm "Khôi phục" để đưa về trạng thái Chờ xử lý.'}
                      </span>
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disableVariantHover
                          disableVariantTextColor
                          onClick={() => handleUpdateField({ status: OrderStatus.PENDING }, setUpdatingStatus)}
                          disabled={updatingStatus}
                          sizeClassName="px-4 py-2"
                          textClassName="text-sm font-semibold text-slate-700 dark:text-slate-200"
                          backgroundClassName="bg-white dark:bg-slate-800"
                          borderClassName="border border-slate-300 dark:border-slate-600"
                          hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
                          roundedClassName="rounded-lg"
                          shadowClassName=""
                          stateClassName="mt-1 transition-colors"
                        >
                          Khôi phục đơn
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    /* Stepper for happy path: PENDING -> PROCESSING -> DELIVERED */
                    (() => {
                      const HAPPY_PATH = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.DELIVERED];
                      const currentIdx = HAPPY_PATH.indexOf(currentOrder.status);
                      const nextStatus = currentIdx >= 0 && currentIdx < HAPPY_PATH.length - 1 ? HAPPY_PATH[currentIdx + 1] : null;
                      return (
                        <>
                          <div className="flex items-center justify-between gap-1 sm:gap-2">
                            {HAPPY_PATH.map((step, idx, arr) => {
                              const isActive = currentOrder.status === step;
                              const isPast = currentIdx > idx;
                              const isReached = isActive || isPast;
                              const baseCircle = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all';
                              const circleCls = isReached
                                ? 'bg-orange-500 text-white shadow-sm shadow-orange-300 dark:bg-orange-500 dark:shadow-none'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
                              const labelCls = isActive
                                ? 'text-slate-900 font-bold dark:text-white'
                                : isPast
                                  ? 'text-slate-600 font-medium dark:text-slate-300'
                                  : 'text-slate-400 dark:text-slate-500';
                              return (
                                <React.Fragment key={step}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disableVariantHover
                                    disableVariantTextColor
                                    disabled={!canEdit || updatingStatus}
                                    onClick={() => handleUpdateField({ status: step }, setUpdatingStatus)}
                                    layoutClassName="group flex flex-col items-center gap-1.5"
                                    sizeClassName=""
                                    shadowClassName=""
                                    backgroundClassName=""
                                    borderClassName=""
                                    roundedClassName=""
                                    stateClassName={!canEdit || updatingStatus ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                  >
                                    <span className={`${baseCircle} ${circleCls}`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`text-[11px] sm:text-xs text-center whitespace-nowrap ${labelCls}`}>
                                      {t(`orders.statusLabels.${step}`)}
                                    </span>
                                  </Button>
                                  {idx < arr.length - 1 ? (
                                    <span className={`mb-5 h-1 flex-1 rounded-full ${isPast ? 'bg-orange-500 dark:bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                  ) : null}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {canEdit ? (
                            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 dark:border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disableVariantHover
                                  disableVariantTextColor
                                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                  onClick={() => setCrMode('cancel')}
                                  disabled={updatingStatus}
                                  sizeClassName="px-3 py-1.5"
                                  textClassName="text-xs font-semibold text-red-700 dark:text-red-200"
                                  backgroundClassName="bg-red-50 dark:bg-red-900/20"
                                  borderClassName="border border-red-200 dark:border-red-800"
                                  hoverClassName="hover:bg-red-100 dark:hover:bg-red-900/30"
                                  roundedClassName="rounded-lg"
                                  shadowClassName=""
                                  stateClassName="transition-colors"
                                >
                                  Huỷ đơn
                                </Button>
                                {currentOrder.paymentStatus === PaymentStatus.PAID ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disableVariantHover
                                    disableVariantTextColor
                                    leftIcon={<Wallet className="h-3.5 w-3.5" />}
                                    onClick={() => setCrMode('refund')}
                                    disabled={updatingStatus}
                                    sizeClassName="px-3 py-1.5"
                                    textClassName="text-xs font-semibold text-amber-700 dark:text-amber-200"
                                    backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
                                    borderClassName="border border-amber-200 dark:border-amber-800"
                                    hoverClassName="hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                    roundedClassName="rounded-lg"
                                    shadowClassName=""
                                    stateClassName="transition-colors"
                                  >
                                    Hoàn tiền
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disableVariantHover
                                  disableVariantTextColor
                                  onClick={() => handleUpdateField({ status: OrderStatus.RETURNED }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  sizeClassName="px-3 py-1.5"
                                  textClassName="text-xs font-semibold text-slate-600 dark:text-slate-300"
                                  backgroundClassName="bg-white dark:bg-slate-800"
                                  borderClassName="border border-slate-200 dark:border-slate-600"
                                  hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
                                  roundedClassName="rounded-lg"
                                  shadowClassName=""
                                  stateClassName="transition-colors"
                                >
                                  Trả hàng
                                </Button>
                              </div>
                              {nextStatus ? (
                                <Button
                                  type="button"
                                  variant="primary"
                                  disableVariantHover
                                  onClick={() => handleUpdateField({ status: nextStatus }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  sizeClassName="px-4 py-2"
                                  textClassName="text-sm font-semibold text-white"
                                  backgroundClassName="bg-orange-500 dark:bg-orange-500"
                                  hoverClassName="hover:bg-orange-600 dark:hover:bg-orange-600"
                                  shadowClassName="shadow-sm shadow-orange-300 dark:shadow-none"
                                  roundedClassName="rounded-lg"
                                  stateClassName="transition-colors"
                                >
                                  Chuyển sang {t(`orders.statusLabels.${nextStatus}`)}
                                  <span aria-hidden="true">→</span>
                                </Button>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                                  ✓ Đơn đã hoàn tất
                                </span>
                              )}
                            </div>
                          ) : null}
                        </>
                      );
                    })()
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.fulfillment')}</Heading>
                   <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">Order Number</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">{currentOrder.orderNumber || t('detail.notAssigned')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.payment')}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[PaymentStatus.PAID, PaymentStatus.UNPAID].map((status) => {
                            const isActive = currentOrder.paymentStatus === status;
                            return (
                              <Button
                                key={status}
                                type="button"
                                variant="ghost"
                                disableVariantHover
                                disableVariantTextColor
                                onClick={() => handleUpdateField({ paymentStatus: status }, setUpdatingPayment)}
                                disabled={!canEdit || updatingPayment}
                                sizeClassName="px-3 py-1"
                                roundedClassName="rounded-full"
                                shadowClassName=""
                                stateClassName="transition-all whitespace-nowrap"
                                textClassName={isActive
                                  ? (status === PaymentStatus.PAID
                                      ? 'text-xs font-bold uppercase text-emerald-700 dark:text-emerald-200'
                                      : 'text-xs font-bold uppercase text-red-700 dark:text-red-200')
                                  : 'text-xs font-bold uppercase text-slate-500 dark:text-slate-300'}
                                backgroundClassName={isActive
                                  ? (status === PaymentStatus.PAID
                                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                      : 'bg-red-50 dark:bg-red-900/30')
                                  : 'bg-white dark:bg-slate-800'}
                                borderClassName={isActive
                                  ? (status === PaymentStatus.PAID
                                      ? 'border border-emerald-300 dark:border-emerald-700'
                                      : 'border border-red-300 dark:border-red-700')
                                  : 'border border-slate-200 dark:border-slate-600'}
                                hoverClassName={isActive ? '' : (status === PaymentStatus.PAID
                                  ? 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-700'
                                  : 'hover:border-red-300 hover:bg-red-50/50 dark:hover:border-red-700')}
                              >
                                {t(`orders.paymentStatusLabels.${status}`)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.paymentMethod')}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[PaymentMethod.BANKING, PaymentMethod.CASH].map((method) => {
                            const isActive = currentOrder.paymentMethod === method;
                            return (
                              <Button
                                key={method}
                                type="button"
                                variant="ghost"
                                disableVariantHover
                                disableVariantTextColor
                                onClick={() => handleUpdateField({ paymentMethod: method }, setUpdatingPayment)}
                                disabled={!canEdit || updatingPayment}
                                sizeClassName="px-3 py-1"
                                roundedClassName="rounded-full"
                                shadowClassName=""
                                stateClassName="transition-all whitespace-nowrap"
                                textClassName={isActive
                                  ? 'text-xs font-semibold text-blue-600 dark:text-blue-300'
                                  : 'text-xs font-semibold text-slate-500 dark:text-slate-300'}
                                backgroundClassName={isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/20'
                                  : 'bg-white dark:bg-slate-800'}
                                borderClassName={isActive
                                  ? 'border border-blue-200 dark:border-blue-800'
                                  : 'border border-slate-200 dark:border-slate-600'}
                                hoverClassName={isActive ? '' : 'hover:border-blue-300'}
                              >
                                {method === PaymentMethod.BANKING ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Delivery type row */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {currentOrder.deliveryType === DeliveryType.PICKUP
                            ? <Store className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            : currentOrder.deliveryType === DeliveryType.SHIP_PROVINCE
                              ? <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              : <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('deliveryType.label')}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {([
                            { dt: DeliveryType.SHIP,          label: t('deliveryType.ship') },
                            { dt: DeliveryType.SHIP_PROVINCE,  label: t('deliveryType.shipProvince') },
                            { dt: DeliveryType.PICKUP,         label: t('deliveryType.pickup') },
                          ]).map(({ dt, label }) => {
                            const isActive = (currentOrder.deliveryType ?? DeliveryType.SHIP) === dt;
                            return (
                              <Button
                                key={dt}
                                type="button"
                                variant="ghost"
                                disableVariantHover
                                disableVariantTextColor
                                onClick={() => handleUpdateField({ deliveryType: dt }, setUpdatingPayment)}
                                disabled={!canEdit || updatingPayment}
                                sizeClassName="px-3 py-1"
                                roundedClassName="rounded-full"
                                shadowClassName=""
                                stateClassName="transition-all whitespace-nowrap"
                                textClassName={isActive
                                  ? 'text-xs font-semibold text-orange-700 dark:text-orange-200'
                                  : 'text-xs font-semibold text-slate-500 dark:text-slate-300'}
                                backgroundClassName={isActive
                                  ? 'bg-orange-50 dark:bg-orange-900/30'
                                  : 'bg-white dark:bg-slate-800'}
                                borderClassName={isActive
                                  ? 'border border-orange-300 dark:border-orange-700'
                                  : 'border border-slate-200 dark:border-slate-600'}
                                hoverClassName={isActive ? '' : 'hover:border-orange-300'}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('detail.transactionNumber')}</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                            {currentOrder.sepayId ? `#${currentOrder.sepayId}` : t('detail.notAssigned')}
                        </span>
                      </div>
                   </div>
                </div>

                {/* Payment QR Section — luôn hiển thị (kể cả khi đơn thanh toán tiền mặt) */}
                {(
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors animate-fade-in">
                     <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('qr.sectionTitle')}</Heading>
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                        <div className="shrink-0 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <img 
                              src={qrUrl} 
                              alt="Payment QR" 
                              className="w-32 h-32 object-contain"
                            />
                        </div>
                        
                        <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-800 dark:text-blue-300 font-semibold">
                              <QrCode className="w-4 h-4" />
                              <span>{t('qr.title')}</span>
                            </div>
                            
                            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                              <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                  <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.bank')}</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">BIDV</span>
                              </div>
                              <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 group cursor-pointer" onClick={() => copyToClipboard('96247HTTH1308')}>
                                  <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.account')}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">96247HTTH1308</span>
                                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                  </div>
                              </div>
                              <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                  <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.accountName')}</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">TON THAT ANH MINH</span>
                              </div>
                              <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                  <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.amount')}</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">
                                    {formatVND(finalTotal)}
                                  </span>
                              </div>
                              <div className="flex justify-between sm:justify-start sm:gap-4 items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                                  <span className="text-xs text-slate-500 uppercase font-medium min-w-[60px]">{t('qr.content')}</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 break-all">
                                    {description}
                                  </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                               {t('qr.instruction')}
                            </p>
                        </div>
                     </div>
                  </div>
                )}

              </div>
            ) : activeTab === 'history' ? (
              (() => {
                const allHistory = Array.isArray(currentOrder.history) ? [...currentOrder.history].reverse() : [];

                // Group: cho moi category, build list { entry, change }
                type CategoryKey = 'status' | 'payment' | 'info';
                type GroupedChange = { entry: any; change: any };
                const groups: Record<CategoryKey, GroupedChange[]> = { status: [], payment: [], info: [] };
                allHistory.forEach((entry: any) => {
                  (entry?.changes || []).forEach((c: any) => {
                    const cat = changeToCategory(entry, c.field);
                    groups[cat].push({ entry, change: c });
                  });
                });

                // Inject synthetic entries từ transactions vào block "Lịch sử nhận tiền".
                // Mỗi transaction = 1 lần SePay ghi nhận tiền — at = receivedAt.
                // Sort desc theo receivedAt để mới nhất hiện trên đầu.
                const txSorted = [...relatedTransactions].sort((a, b) => {
                  const ta = new Date(a.receivedAt).getTime();
                  const tb = new Date(b.receivedAt).getTime();
                  return tb - ta;
                });
                txSorted.forEach((tx) => {
                  const syntheticEntry = {
                    at: tx.receivedAt,
                    by: 'System (SePay)',
                    byUid: 'system',
                  };
                  const syntheticChange = {
                    field: 'paymentReceived',
                    label: `Đã nhận thanh toán • #${tx.sepayId}`,
                    oldValue: '—',
                    newValue: formatVND(tx.transferAmount),
                  };
                  groups.payment.push({ entry: syntheticEntry, change: syntheticChange });
                });

                const CATEGORY_META: Array<{
                  key: CategoryKey;
                  title: string;
                  icon: any;
                  borderClass: string;
                  iconBgClass: string;
                  dotClass: string;
                  dotRingClass: string;
                }> = [
                  { key: 'status', title: 'Lịch sử trạng thái', icon: StickyNote,
                    borderClass: 'border-orange-200 dark:border-orange-800',
                    iconBgClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
                    dotClass: 'bg-orange-500', dotRingClass: 'ring-orange-200 dark:ring-orange-900' },
                  { key: 'payment', title: 'Lịch sử nhận tiền', icon: Wallet,
                    borderClass: 'border-emerald-200 dark:border-emerald-800',
                    iconBgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                    dotClass: 'bg-emerald-500', dotRingClass: 'ring-emerald-200 dark:ring-emerald-900' },
                  { key: 'info', title: 'Lịch sử thông tin', icon: FileText,
                    borderClass: 'border-slate-200 dark:border-slate-700',
                    iconBgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                    dotClass: 'bg-slate-400', dotRingClass: 'ring-slate-200 dark:ring-slate-700' },
                ];

                return (
                  <div className="space-y-4">
                    {CATEGORY_META.map((meta) => {
                      const Icon = meta.icon;
                      const items = groups[meta.key];
                      const isEmpty = items.length === 0;
                      return (
                        <div
                          key={meta.key}
                          className={`rounded-xl border-2 bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 ${meta.borderClass}`}
                        >
                          {/* Category header */}
                          <div className="mb-4 flex items-center gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBgClass}`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                                {meta.title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {isEmpty ? 'Chưa có thay đổi' : `${items.length} thay đổi`}
                              </div>
                            </div>
                          </div>

                          {isEmpty ? (
                            /* Empty placeholder */
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30 py-8 px-4 text-center">
                              <Icon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Chưa có lịch sử cho mục này
                              </p>
                            </div>
                          ) : (
                            /* Timeline */
                            <ol className="relative space-y-4 border-l-2 border-slate-200 dark:border-slate-700 pl-5">
                              {items.map((g, ci) => {
                                const at = g.entry?.at?.toDate ? g.entry.at.toDate() : new Date(g.entry?.at);
                                const atLabel = at && !isNaN(at.getTime())
                                  ? at.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : '—';
                                return (
                                  <li key={ci} className="relative">
                                    <span className={`absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ring-2 dark:border-slate-800 ${meta.dotClass} ${meta.dotRingClass}`} />
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {g.entry?.byUid === 'system'
                                          ? (g.entry?.by || 'System')
                                          : (g.entry?.by || 'Unknown')}
                                      </span>
                                      {g.entry?.byUid === 'system' ? (
                                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                          AUTO
                                        </span>
                                      ) : null}
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {atLabel}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-slate-100 bg-slate-50/70 p-2 text-xs dark:border-slate-700 dark:bg-slate-700/30">
                                      <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                                        {g.change.label || g.change.field}
                                      </span>
                                      <span className="text-slate-500 line-through dark:text-slate-400 break-all">
                                        {formatHistoryValue(g.change.field, g.change.oldValue)}
                                      </span>
                                      <span className="text-slate-400" aria-hidden="true">→</span>
                                      <span className="font-semibold text-orange-700 dark:text-orange-300 break-all">
                                        {formatHistoryValue(g.change.field, g.change.newValue)}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : null}
        </div>
      </div>
    </BaseSlidePanel>

    <CancelRefundModal
      open={crMode !== null}
      mode={crMode ?? 'cancel'}
      order={currentOrder}
      onClose={() => setCrMode(null)}
      onConfirm={handleCancelRefund}
    />
    </>
  );
};

export default OrderDetail;
