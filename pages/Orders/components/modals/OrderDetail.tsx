import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Copy,
  CreditCard,
  FileText,
  History,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Receipt,
  Sparkles,
  StickyNote,
  Store,
  Trash2,
  Truck,
  User,
  Wallet,
  X
} from 'lucide-react';
import { STATUS_COLORS } from '@/constant/order';
import { generateOrderAnalysis } from '@/services/geminiService';
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
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'history'>('details');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<'email' | 'risk' | 'summary' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
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

  const handleAiAction = async (type: 'email' | 'risk' | 'summary') => {
    setSelectedPrompt(type);
    setLoadingAi(true);
    const response = await generateOrderAnalysis(currentOrder, type, language);
    setAiResponse(response);
    setLoadingAi(false);
  };


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
    }
    if (field === 'total' || field === 'shippingCost') {
      const n = Number(value);
      if (!isNaN(n)) return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    }
    return s;
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
            onClick={() => setActiveTab('ai')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName={
              activeTab === 'ai' ? 'border-b-2 border-rose-600' : 'border-b-2 border-transparent'
            }
            textClassName={
              activeTab === 'ai'
                ? 'text-sm font-medium text-rose-600 dark:text-rose-400'
                : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }
            layoutClassName="flex items-center gap-2 rounded-none py-4 shadow-none"
            stateClassName="transition-colors"
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {t('detail.tabAi')}
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
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.customer')}</h3>
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
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    {t('detail.note')}
                  </h3>
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
                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.items')}</h3>
                   <div className="space-y-4">
                     {currentOrder.items.map((item) => (
                       <div key={item.id} className="flex items-center gap-4 py-2">
                         <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                         <div className="flex-1">
                           <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400">ID: {item.id}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium text-slate-900 dark:text-white">{formatVND(calculateLineItemTotal(item))}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.subtotal')}</span>
                       <span>{formatVND(subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                       <span>{t('detail.shipping')}</span>
                       <span>{formatVND(shippingCost)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                       <span className="font-medium text-slate-900 dark:text-white">{t('detail.total')}</span>
                       <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatVND(finalTotal)}</span>
                     </div>
                   </div>
                </div>

                {/* STATUS STEPPER CARD */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    {t('orders.tableStatus')}
                  </h3>

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
                        <button
                          type="button"
                          onClick={() => handleUpdateField({ status: OrderStatus.PENDING }, setUpdatingStatus)}
                          disabled={updatingStatus}
                          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Khôi phục đơn
                        </button>
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
                                  <button
                                    type="button"
                                    disabled={!canEdit || updatingStatus}
                                    onClick={() => handleUpdateField({ status: step }, setUpdatingStatus)}
                                    className={`group flex flex-col items-center gap-1.5 ${!canEdit || updatingStatus ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <span className={`${baseCircle} ${circleCls}`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`text-[11px] sm:text-xs text-center whitespace-nowrap ${labelCls}`}>
                                      {t(`orders.statusLabels.${step}`)}
                                    </span>
                                  </button>
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
                                <button
                                  type="button"
                                  onClick={() => handleUpdateField({ status: OrderStatus.CANCELLED }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Huỷ đơn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateField({ status: OrderStatus.RETURNED }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                >
                                  Trả hàng
                                </button>
                              </div>
                              {nextStatus ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateField({ status: nextStatus }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-300 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-orange-500 dark:shadow-none dark:hover:bg-orange-600 transition-colors"
                                >
                                  Chuyển sang {t(`orders.statusLabels.${nextStatus}`)}
                                  <span aria-hidden="true">→</span>
                                </button>
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
                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('detail.fulfillment')}</h3>
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
                            const activeClass =
                              status === PaymentStatus.PAID
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700'
                                : 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
                            const inactiveHover =
                              status === PaymentStatus.PAID
                                ? 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-700'
                                : 'hover:border-red-300 hover:bg-red-50/50 dark:hover:border-red-700';
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleUpdateField({ paymentStatus: status }, setUpdatingPayment)}
                                disabled={!canEdit || updatingPayment}
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${
                                  isActive
                                    ? activeClass
                                    : `bg-white text-slate-500 border-slate-200 ${inactiveHover} dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600`
                                } ${!canEdit || updatingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {t(`orders.paymentStatusLabels.${status}`)}
                              </button>
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
                          {[PaymentMethod.BANKING, PaymentMethod.CASH].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => handleUpdateField({ paymentMethod: method }, setUpdatingPayment)}
                              disabled={!canEdit || updatingPayment}
                              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                                currentOrder.paymentMethod === method
                                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                              } ${!canEdit || updatingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {method === PaymentMethod.BANKING ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Delivery type row */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {currentOrder.deliveryType === DeliveryType.PICKUP
                            ? <Store className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            : <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                          <span className="text-sm text-slate-600 dark:text-slate-300">{t('deliveryType.label')}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {([DeliveryType.SHIP, DeliveryType.PICKUP] as DeliveryType[]).map((dt) => (
                            <button
                              key={dt}
                              type="button"
                              onClick={() => handleUpdateField({ deliveryType: dt }, setUpdatingPayment)}
                              disabled={!canEdit || updatingPayment}
                              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                                (currentOrder.deliveryType ?? DeliveryType.SHIP) === dt
                                  ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                              } ${!canEdit || updatingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {dt === DeliveryType.SHIP ? t('deliveryType.ship') : t('deliveryType.pickup')}
                            </button>
                          ))}
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
                     <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">{t('qr.sectionTitle')}</h3>
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
            ) : (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-orange-500 to-rose-600 dark:from-orange-700 dark:to-rose-800 rounded-xl p-6 text-white mb-6 shadow-md transition-colors">
                   <div className="flex items-center gap-3 mb-2">
                     <Sparkles className="w-6 h-6 text-yellow-300" />
                     <h3 className="font-bold text-lg">Gemini Intelligence</h3>
                   </div>
                   <p className="text-orange-50 dark:text-orange-100 text-sm">
                     {t('detail.aiIntro')}
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <button 
                    onClick={() => handleAiAction('email')}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'email' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 ring-2 ring-orange-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md'}`}
                  >
                    <Mail className="w-5 h-5 text-orange-500 dark:text-orange-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.draftEmail')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Apology or update for {currentOrder.customer.name.split(' ')[0]}</span>
                  </button>

                  <button 
                     onClick={() => handleAiAction('risk')}
                     className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'risk' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 ring-2 ring-orange-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md'}`}
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.riskCheck')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analyze fraud & fulfillment risks</span>
                  </button>

                  <button 
                     onClick={() => handleAiAction('summary')}
                     className={`p-4 rounded-xl border text-left transition-all ${selectedPrompt === 'summary' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 ring-2 ring-blue-500 ring-opacity-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'}`}
                  >
                    <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2" />
                    <span className="block font-medium text-slate-900 dark:text-white text-sm">{t('detail.summarize')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Internal briefing for ops team</span>
                  </button>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden flex flex-col transition-colors">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    {loadingAi ? 'Generating Analysis...' : 'AI Output'}
                  </h4>
                  
                  {loadingAi ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-70">
                      <div className="w-10 h-10 border-4 border-orange-200 dark:border-orange-800 border-t-orange-600 dark:border-t-orange-400 rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('detail.consulting')}</p>
                    </div>
                  ) : aiResponse ? (
                     <div className="flex-1 overflow-y-auto">
                       <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{aiResponse}</p>
                       <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                         <button 
                           onClick={() => navigator.clipboard.writeText(aiResponse)}
                           className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
                         >
                           {t('detail.copyClipboard')}
                         </button>
                       </div>
                     </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      Select an action above to generate content.
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </BaseSlidePanel>
  );
};

export default OrderDetail;
