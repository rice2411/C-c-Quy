import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { toBlob } from 'html-to-image';
import {
  BadgeCheck,
  Banknote,
  Check,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Globe,
  History,
  Link2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Receipt,
  Share2,
  StickyNote,
  Store,
  Trash2,
  Truck,
  Unlink,
  User,
  Wallet,
  X
} from 'lucide-react';
import { STATUS_COLORS } from '@/constant/order';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { qk } from '@/hooks/queryKeys';
import { ORDER_EDIT_DENIED, reconcileRefund, markRefundCash, unreconcileRefund } from '@/services/orderService';
import { fetchTransactionsByOrderNumber, fetchOutUnlinkedTransactions } from '@/services/transactionService';
import { DeliveryType, Order, OrderItem, PaymentMethod, OrderStatus, PaymentStatus, Transaction, productUsesFlavorPricing, flavorImage, flavorVariantColor, groupFlavors, sizeCountsLabel } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { UserRole } from '@/types/user';
import { orderAddressFallbackKey, surchargeTagLabel, reconcileMethodLabel } from '@/types/order';
import { useSurchargeTags } from '@/hooks/queries/useSurchargeTagsQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import { allocateSurcharge, generateQRCodeImage, getOrderTotal } from '@/utils/order/orderUtils';
import { Sparkles } from 'lucide-react';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Image from '@/components/ui/Image';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import CancelRefundModal, { type CancelRefundMode, type CancelRefundResult } from '@/pages/Orders/components/modals/CancelRefundModal';
import ShareableOrderCard from '@/pages/Orders/components/modals/ShareableOrderCard';
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
  const { products } = useProducts();
  const { currentUser, userData } = useAuth();
  const { surchargeTags } = useSurchargeTags();
  const { activeAccount } = usePaymentAccounts();
  const [activeTab, setActiveTab] = useState<'details' | 'refund' | 'history'>('details');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [crMode, setCrMode] = useState<CancelRefundMode | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  // ── Đối soát phiếu hoàn ↔ GD SePay tiền ra (#186) ──
  // Chỉ Admin/Super Admin được thao tác (như refund).
  const canReconcile =
    userData?.role === UserRole.ADMIN || userData?.role === UserRole.SUPER_ADMIN;
  /** refundId đang mở panel chọn giao dịch (null = không mở). */
  const [pickerRefundId, setPickerRefundId] = useState<string | null>(null);
  /** Danh sách GD tiền ra chưa gắn (load khi mở picker). */
  const [outTx, setOutTx] = useState<Transaction[]>([]);
  const [outTxLoading, setOutTxLoading] = useState(false);
  /** refundId đang chạy 1 thao tác đối soát (disable nút + spinner). */
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  // Transactions của đơn hiện tại qua React Query — chỉ chạy khi có orderNumber.
  // Mỗi transaction render thành 1 entry trong block "Lịch sử nhận tiền".
  const orderNumberForTx = order?.orderNumber ?? '';
  const txQuery = useQuery({
    queryKey: qk.transactions.byOrderNumber(orderNumberForTx),
    queryFn: () => fetchTransactionsByOrderNumber(orderNumberForTx),
    enabled: !!currentUser && !!orderNumberForTx,
  });
  const relatedTransactions: Transaction[] = txQuery.data ?? [];

  React.useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  // Khi trạng thái thanh toán / sepayId của đơn đổi (vd sau khi ghi nhận thanh
  // toán) → refetch transactions để cập nhật "Lịch sử nhận tiền" như cũ.
  React.useEffect(() => {
    if (orderNumberForTx) void txQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paymentStatus, order?.sepayId]);

  const shareRef = useRef<HTMLDivElement>(null);
  const [copyingImg, setCopyingImg] = useState(false);
  // Object URL của ảnh đơn để hiển thị <Image> trong modal preview.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Giữ blob gốc để nút "Copy ảnh" trong modal copy vào clipboard mà không render lại.
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  // Cờ loading khi đang copy ảnh từ modal preview.
  const [copyingPreview, setCopyingPreview] = useState(false);

  const currentOrder = localOrder || order;
  if (!currentOrder) return null;

  const calculateLineItemTotal = (item: OrderItem) => {
    return item.price * item.quantity;
  };

  const shippingCost = currentOrder.shippingCost || 0;
  
  const subtotal = currentOrder.items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
  
  const finalTotal = getOrderTotal(currentOrder);

  // Phụ thu nhiều dòng (fallback đơn cũ = 1 dòng từ surchargeAmount/tag).
  const surchargeRows = (
    currentOrder.surcharges && currentOrder.surcharges.length > 0
      ? currentOrder.surcharges
      : currentOrder.surchargeAmount
        ? [{ tag: currentOrder.surchargeTag, amount: currentOrder.surchargeAmount }]
        : []
  ).filter((s) => Number(s.amount) > 0);

  const description = `SEVQR ${currentOrder.orderNumber}`;
  // Không có TK active → qrUrl rỗng → section QR ẩn an toàn.
  const qrUrl = activeAccount ? generateQRCodeImage(currentOrder.orderNumber, finalTotal, activeAccount) : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Chụp thẻ thông tin gửi khách (ShareableOrderCard, off-screen) → ảnh PNG rồi
  // LUÔN mở MODAL PREVIEW (cả desktop lẫn mobile). Không tự copy, không tự đóng.
  // Trong modal user chọn: Copy ảnh (clipboard) HOẶC tự chụp màn hình / tải ảnh.
  const handleShareOrder = async () => {
    if (!shareRef.current || copyingImg) return;
    setCopyingImg(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready; // tránh nhảy font khi render
      const node = shareRef.current;
      if (!node) throw new Error('no node');
      const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
      // Inline mọi ảnh thành dataURL TRƯỚC khi chụp — né taint canvas do CORS/cache:
      // ảnh SP (RiceService) & QR (SePay) có CORS → fetch (cors, reload) được; ảnh nào
      // KHÔNG có CORS (Firebase cũ) fetch fail → thay ảnh trong suốt để html-to-image
      // không bị "tainted canvas" (toBlob sẽ throw). Sau inline: mọi src là data:/ảnh trong suốt.
      const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.src;
          if (!src || src.startsWith('data:')) return;
          try {
            const res = await fetch(src, { mode: 'cors', cache: 'reload' });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            img.src = await new Promise<string>((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result as string);
              fr.onerror = () => reject(new Error('read fail'));
              fr.readAsDataURL(blob);
            });
          } catch {
            img.removeAttribute('crossorigin');
            img.src = TRANSPARENT; // không tải được → để trống, tránh taint
          }
          await new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) resolve();
            else {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }
          });
        }),
      );
      // Ảnh đã inline data: nên không cần cacheBust nữa.
      const opts = { pixelRatio: 2, backgroundColor: '#ffffff' } as const;
      // html-to-image hay miss ảnh ở lần chụp đầu (nhất là mobile) → warm-up rồi chụp thật.
      await toBlob(node, opts);
      const blob = await toBlob(node, opts);
      if (!blob) throw new Error('no blob');
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setPreviewBlob(blob);
    } catch {
      toast.error(t('detail.copyImageError') || 'Không tạo được ảnh đơn');
    } finally {
      setCopyingImg(false);
    }
  };

  // Copy ảnh trong modal preview vào clipboard, GIỮ NGUYÊN modal mở.
  // Trình duyệt không hỗ trợ / fail → toast hướng dẫn tải ảnh hoặc chụp màn hình.
  const copyPreviewImage = async () => {
    if (!previewBlob || copyingPreview) return;
    const canClipboard = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
    if (!canClipboard) {
      toast.error(t('detail.copyImageUnsupported') || 'Trình duyệt không hỗ trợ copy — hãy tải ảnh hoặc chụp màn hình');
      return;
    }
    setCopyingPreview(true);
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': previewBlob })]);
      toast.success(t('detail.copyImageSuccess') || 'Đã copy ảnh đơn vào clipboard');
    } catch {
      toast.error(t('detail.copyImageUnsupported') || 'Trình duyệt không hỗ trợ copy — hãy tải ảnh hoặc chụp màn hình');
    } finally {
      setCopyingPreview(false);
    }
  };

  // Đóng modal preview + giải phóng object URL + clear blob.
  const closePreview = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewBlob(null);
  };

  // Tải ảnh đơn từ modal preview xuống máy.
  const downloadPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${currentOrder.orderNumber || 'don-hang'}.png`;
    a.click();
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

  /* ── Đối soát phiếu hoàn (#186) ── */

  // Map mã code lỗi BE → message i18n để toast rõ ràng.
  const reconcileErrorMessage = (e: unknown): string => {
    const code = e instanceof Error ? e.message : '';
    switch (code) {
      case 'TRANSACTION_ALREADY_LINKED':
        return t('reconcile.errAlreadyLinked');
      case 'TRANSACTION_NOT_OUTGOING':
        return t('reconcile.errNotOutgoing');
      case 'TRANSACTION_NOT_FOUND':
        return t('reconcile.errTxNotFound');
      case 'REFUND_NOT_FOUND':
        return t('reconcile.errRefundNotFound');
      default:
        return t('reconcile.errGeneric');
    }
  };

  // Mở/đóng panel chọn giao dịch cho 1 phiếu hoàn; load danh sách khi mở.
  const handleOpenPicker = async (refundId: string) => {
    if (pickerRefundId === refundId) {
      setPickerRefundId(null);
      return;
    }
    setPickerRefundId(refundId);
    setOutTxLoading(true);
    try {
      const list = await fetchOutUnlinkedTransactions();
      setOutTx(list);
    } catch (e) {
      console.error(e);
      toast.error(t('reconcile.loadTxFailed'));
      setOutTx([]);
    } finally {
      setOutTxLoading(false);
    }
  };

  // Gắn 1 GD SePay cho phiếu hoàn → BE trả Order đầy đủ → refresh state đơn.
  const handleReconcileSepay = async (refundId: string, transactionId: string) => {
    if (!currentOrder?.id || reconcilingId) return;
    setReconcilingId(refundId);
    try {
      const updated = await reconcileRefund(currentOrder.id, refundId, transactionId);
      setLocalOrder(updated);
      setPickerRefundId(null);
      toast.success(t('reconcile.reconciledSepay'));
    } catch (e) {
      console.error(e);
      toast.error(reconcileErrorMessage(e));
    } finally {
      setReconcilingId(null);
    }
  };

  // Đánh dấu phiếu hoàn trả tiền mặt.
  const handleReconcileCash = async (refundId: string) => {
    if (!currentOrder?.id || reconcilingId) return;
    setReconcilingId(refundId);
    try {
      const updated = await markRefundCash(currentOrder.id, refundId);
      setLocalOrder(updated);
      setPickerRefundId(null);
      toast.success(t('reconcile.markedCash'));
    } catch (e) {
      console.error(e);
      toast.error(reconcileErrorMessage(e));
    } finally {
      setReconcilingId(null);
    }
  };

  // Gỡ đối soát phiếu hoàn.
  const handleUnreconcile = async (refundId: string) => {
    if (!currentOrder?.id || reconcilingId) return;
    setReconcilingId(refundId);
    try {
      const updated = await unreconcileRefund(currentOrder.id, refundId);
      setLocalOrder(updated);
      toast.success(t('reconcile.unreconciled'));
    } catch (e) {
      console.error(e);
      toast.error(reconcileErrorMessage(e));
    } finally {
      setReconcilingId(null);
    }
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
        onClick={handleShareOrder}
        disabled={copyingImg}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        borderClassName="border border-primary-200 dark:border-primary-700/50"
        backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
        hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/30"
        textClassName="text-sm font-medium text-primary-700 dark:text-primary-300"
        roundedClassName="rounded-lg"
        layoutClassName="mr-auto px-4 py-2"
        stateClassName="transition-colors disabled:opacity-50"
        leftIcon={<Share2 className="h-4 w-4" />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      >
        {copyingImg ? (t('detail.copyImageLoading') || 'Đang tạo ảnh...') : (t('detail.shareOrder') || 'Gửi khách')}
      </Button>
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
          backgroundClassName="bg-primary-600 dark:bg-primary-500"
          hoverClassName="hover:bg-primary-700 dark:hover:bg-primary-600"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm shadow-primary-200 dark:shadow-none"
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
      <Box layoutClassName="flex flex-col h-full">
        <Box
          layoutClassName="flex space-x-6 px-6"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
          stateClassName="transition-colors"
        >
          <Button
            type="button"
            onClick={() => setActiveTab('details')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName={
              activeTab === 'details' ? 'border-b-2 border-primary-600' : 'border-b-2 border-transparent'
            }
            textClassName={
              activeTab === 'details'
                ? 'text-sm font-medium text-primary-600 dark:text-primary-400'
                : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }
            layoutClassName="rounded-none py-4 shadow-none"
            stateClassName="transition-colors"
          >
            {t('detail.tabDetails')}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab('refund')}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName={
              activeTab === 'refund' ? 'border-b-2 border-amber-600' : 'border-b-2 border-transparent'
            }
            textClassName={
              activeTab === 'refund'
                ? 'text-sm font-medium text-amber-600 dark:text-amber-400'
                : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }
            layoutClassName="flex items-center gap-2 rounded-none py-4 shadow-none"
            stateClassName="transition-colors"
            leftIcon={<Wallet className="h-4 w-4" />}
          >
            {t('detail.tabRefund')}
            {Array.isArray(currentOrder.refunds) && currentOrder.refunds.length > 0 ? (
              <Box
                layoutClassName="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center px-1.5"
                roundedClassName="rounded-full"
                backgroundClassName="bg-amber-100 dark:bg-amber-900/40"
                textClassName="text-[10px] font-bold text-amber-700 dark:text-amber-300"
              >
                {currentOrder.refunds.length}
              </Box>
            ) : null}
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
                <Box
                  layoutClassName="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center px-1.5"
                  roundedClassName="rounded-full"
                  backgroundClassName="bg-sky-100 dark:bg-sky-900/40"
                  textClassName="text-[10px] font-bold text-sky-700 dark:text-sky-300"
                >
                  {total}
                </Box>
              ) : null;
            })()}
          </Button>
        </Box>

        <Box
          layoutClassName="flex-1 overflow-y-auto p-6"
          backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
          stateClassName="transition-colors"
        >
            {activeTab === 'details' ? (
              <Box layoutClassName="space-y-6">
                <Box
                  layoutClassName="p-5"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                  shadowClassName="shadow-sm"
                  stateClassName="transition-colors"
                >
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 uppercase tracking-wide">{t('detail.customer')}</Heading>
                  <Box layoutClassName="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Box layoutClassName="space-y-3">
                      {currentOrder.customer.name && (
                        <Box layoutClassName="flex items-center gap-3">
                          <Box layoutClassName="p-2" backgroundClassName="bg-slate-100 dark:bg-slate-700" roundedClassName="rounded-lg" textClassName="text-slate-500 dark:text-slate-300">
                            <User className="w-4 h-4" />
                          </Box>
                          <Box layoutClassName="text-sm">
                            <Typography as="p" size="inherit" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{t('detail.customerName')}</Typography>
                            <Typography as="p" size="inherit" textClassName="text-slate-600 dark:text-slate-300">{currentOrder.customer.name}</Typography>
                          </Box>
                        </Box>
                      )}
                      {currentOrder.customer.email && (
                        <Box layoutClassName="flex items-center gap-3">
                           <Box layoutClassName="p-2" backgroundClassName="bg-slate-100 dark:bg-slate-700" roundedClassName="rounded-lg" textClassName="text-slate-500 dark:text-slate-300">
                             <Mail className="w-4 h-4" />
                           </Box>
                           <Box layoutClassName="text-sm">
                             <Typography as="p" size="inherit" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{t('detail.email')}</Typography>
                             <Typography as="span" size="inherit" textClassName="text-slate-600 dark:text-slate-300">{currentOrder.customer.email}</Typography>
                           </Box>
                        </Box>
                      )}
                      {currentOrder.customer.phone && (
                        <Box layoutClassName="flex items-center gap-3">
                           <Box layoutClassName="p-2" backgroundClassName="bg-slate-100 dark:bg-slate-700" roundedClassName="rounded-lg" textClassName="text-slate-500 dark:text-slate-300">
                             <Phone className="w-4 h-4" />
                           </Box>
                           <Box layoutClassName="text-sm">
                             <Typography as="p" size="inherit" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{t('detail.phone')}</Typography>
                             <Typography as="span" size="inherit" textClassName="text-slate-600 dark:text-slate-300">{currentOrder.customer.phone}</Typography>
                           </Box>
                        </Box>
                      )}
                    </Box>
                    <Box layoutClassName="flex items-start gap-3">
                      <Box layoutClassName="p-2" backgroundClassName="bg-slate-100 dark:bg-slate-700" roundedClassName="rounded-lg" textClassName="text-slate-500 dark:text-slate-300">
                        {!currentOrder.customer.address && currentOrder.deliveryType === DeliveryType.PICKUP ? (
                          <Store className="w-4 h-4" />
                        ) : !currentOrder.customer.address && currentOrder.deliveryType === DeliveryType.SHIP_PROVINCE ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </Box>
                      <Box layoutClassName="text-sm">
                        <Typography as="p" size="inherit" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{t('detail.shippingAddress')}</Typography>
                        <Typography as="p" size="inherit" textClassName="text-slate-500 dark:text-slate-400">{currentOrder.customer.address || t(orderAddressFallbackKey(currentOrder.deliveryType))}</Typography>
                        {currentOrder.customer.city && <Typography as="p" size="inherit" textClassName="text-slate-500 dark:text-slate-400">{currentOrder.customer.city}, {currentOrder.customer.country}</Typography>}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Note Section - Separate card */}
                <Box
                  layoutClassName="p-5"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                  shadowClassName="shadow-sm"
                  stateClassName="transition-colors"
                >
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 flex items-center gap-2 uppercase tracking-wide">
                    {t('detail.note')}
                  </Heading>
                  {currentOrder.note ? (
                    <Box
                      layoutClassName="p-4"
                      backgroundClassName="bg-slate-50 dark:bg-slate-700/30"
                      borderClassName="border border-slate-100 dark:border-slate-700"
                      roundedClassName="rounded-lg"
                    >
                      <Typography as="p" size="sm" layoutClassName="font-medium leading-relaxed whitespace-pre-wrap" textClassName="text-slate-900 dark:text-white">
                        {currentOrder.note}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      layoutClassName="p-4"
                      backgroundClassName="bg-slate-50 dark:bg-slate-700/30"
                      borderClassName="border border-slate-100 dark:border-slate-700"
                      roundedClassName="rounded-lg"
                    >
                      <Typography as="p" size="sm" layoutClassName="italic" textClassName="text-slate-400 dark:text-slate-500">
                        {t('detail.noNote') || 'No note provided'}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box
                  layoutClassName="p-5"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                  shadowClassName="shadow-sm"
                  stateClassName="transition-colors"
                >
                   <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 uppercase tracking-wide">{t('detail.items')}</Heading>
                   <Box layoutClassName="space-y-4">
                     {currentOrder.items.flatMap((item) => {
                       const product = products.find((p) => p.id === item.productId);
                       const flavors = item.flavors ?? [];
                       // Sản phẩm tính giá theo vị + nhiều vị → tách mỗi vị 1 dòng item riêng.
                       if (product && productUsesFlavorPricing(product) && flavors.length > 0) {
                         // Gom vị lặp → mỗi vị 1 dòng, SL = số cái vị đó, giá = giá vị × SL.
                         return groupFlavors(flavors).map(({ name: fl, qty }) => {
                           const variant = product.flavorVariants?.find((v) => v.name === fl);
                           const img = variant?.image || item.image;
                           const color = variant?.color || '#64748b';
                           const lineTotal = (variant?.price ?? 0) * qty;
                           return (
                             <Box key={`${item.id}-${fl}`} layoutClassName="flex items-center gap-4 py-2">
                               <Box layoutClassName="h-16 w-16 shrink-0 overflow-hidden" roundedClassName="rounded-lg" backgroundClassName="bg-slate-100 dark:bg-slate-700">
                                 <Image src={img} alt={fl} layoutClassName="h-full w-full object-cover" />
                               </Box>
                               <Box layoutClassName="min-w-0 flex-1">
                                 <Heading level={4} textClassName="text-sm font-medium text-slate-900 dark:text-white">{item.name} · {fl}</Heading>
                                 <Box layoutClassName="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5" roundedClassName="rounded-full" borderClassName="border" style={{ borderColor: color + '80', backgroundColor: color + '26' }}>
                                   <Box layoutClassName="h-2 w-2 shrink-0" roundedClassName="rounded-full" style={{ backgroundColor: color }} />
                                   <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{fl}</Typography>
                                 </Box>
                               </Box>
                               <Box layoutClassName="text-right">
                                 <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{formatVND(lineTotal)}</Typography>
                                 <Typography as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">Qty: {qty}</Typography>
                               </Box>
                             </Box>
                           );
                         });
                       }
                       // Mặc định: 1 dòng (kèm size + vị dạng chip nếu có).
                       return [(
                         <Box key={item.id} layoutClassName="flex items-center gap-4 py-2">
                           <Box layoutClassName="h-16 w-16 shrink-0 overflow-hidden" roundedClassName="rounded-lg" backgroundClassName="bg-slate-100 dark:bg-slate-700">
                             <Image src={item.image} alt={item.name} layoutClassName="h-full w-full object-cover" />
                           </Box>
                           <Box layoutClassName="min-w-0 flex-1">
                             <Heading level={4} textClassName="text-sm font-medium text-slate-900 dark:text-white">{item.name}{sizeCountsLabel(item.sizeCounts) ? ` · ${sizeCountsLabel(item.sizeCounts)}` : item.size ? ` · ${item.size}` : ''}</Heading>
                             {flavors.length ? (
                               <Box layoutClassName="mt-1 flex flex-wrap gap-1">
                                 {groupFlavors(flavors).map(({ name: fl, qty }) => {
                                   const color = product ? flavorVariantColor(product, fl) : '#64748b';
                                   return (
                                     <Box key={fl} layoutClassName="inline-flex items-center gap-1 px-2 py-0.5" roundedClassName="rounded-full" borderClassName="border" style={{ borderColor: color + '80', backgroundColor: color + '26' }}>
                                       <Box layoutClassName="h-2 w-2 shrink-0" roundedClassName="rounded-full" style={{ backgroundColor: color }} />
                                       <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{fl}{qty > 1 ? ` ×${qty}` : ''}</Typography>
                                     </Box>
                                   );
                                 })}
                               </Box>
                             ) : null}
                           </Box>
                           <Box layoutClassName="text-right">
                             <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{formatVND(calculateLineItemTotal(item))}</Typography>
                             <Typography as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">Qty: {item.quantity}</Typography>
                           </Box>
                         </Box>
                       )];
                     })}
                   </Box>

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

                   {currentOrder.surchargeAmount && currentOrder.surchargeAmount > 0 ? (
                     <Box layoutClassName="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                       <Typography as="p" size="xs" layoutClassName="mb-2 font-semibold uppercase tracking-wide" textClassName="text-slate-400 dark:text-slate-500">{t('detail.surcharge')}</Typography>
                       <Box layoutClassName="space-y-1.5">
                         {surchargeRows.map((s, i) => (
                           <Box key={i} layoutClassName="flex items-center justify-between gap-2">
                             <Badge
                               size="sm"
                               borderClassName="border-primary-300 dark:border-primary-700"
                               backgroundClassName="bg-white dark:bg-slate-800"
                               textClassName="text-primary-700 dark:text-primary-300"
                             >
                               <Sparkles className="h-3 w-3" /> {surchargeTagLabel(s.tag, surchargeTags)}
                             </Badge>
                             <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(s.amount)}</Typography>
                           </Box>
                         ))}
                       </Box>
                       <Typography as="p" size="xs" layoutClassName="mt-1.5" textClassName="text-slate-400 dark:text-slate-500">
                         {t('detail.surchargeSplit')}: {allocateSurcharge(currentOrder.surchargeAmount, currentOrder.items).map((share, idx) => (
                           `${currentOrder.items[idx]?.name ?? ''} +${formatVND(share)}`
                         )).join(' · ')}
                       </Typography>
                     </Box>
                   ) : null}

                   <Box layoutClassName="mt-4 pt-4 space-y-2" borderClassName="border-t border-slate-100 dark:border-slate-700">
                     <Box layoutClassName="flex justify-between items-center" textClassName="text-sm text-slate-500 dark:text-slate-400">
                       <Typography as="span" size="inherit">{t('detail.subtotal')}</Typography>
                       <Typography as="span" size="inherit">{formatVND(subtotal)}</Typography>
                     </Box>
                     {surchargeRows.map((s, i) => (
                       <Box key={i} layoutClassName="flex items-center justify-between" textClassName="text-sm text-primary-600 dark:text-primary-400">
                         <Typography as="span" size="sm">
                           {t('detail.surcharge')}
                           <Typography as="span" size="xs" layoutClassName="ml-1.5" textClassName="text-slate-400 dark:text-slate-500">· {surchargeTagLabel(s.tag, surchargeTags)}</Typography>
                         </Typography>
                         <Typography as="span" size="sm">+{formatVND(s.amount)}</Typography>
                       </Box>
                     ))}
                     <Box layoutClassName="flex justify-between items-center" textClassName="text-sm text-slate-500 dark:text-slate-400">
                       <Typography as="span" size="inherit">{t('detail.shipping')}</Typography>
                       <Typography as="span" size="inherit">{formatVND(shippingCost)}</Typography>
                     </Box>
                     {currentOrder.decorations && currentOrder.decorations.length > 0 ? (
                       <Box layoutClassName="flex items-center justify-between" textClassName="text-sm text-slate-500 dark:text-slate-400">
                         <Typography as="span" size="sm">Trang trí</Typography>
                         <Typography as="span" size="sm">{formatVND(currentOrder.decorations.reduce((s, d) => s + d.price * d.quantity, 0))}</Typography>
                       </Box>
                     ) : null}
                     {currentOrder.discountAmount && currentOrder.discountAmount > 0 ? (
                       <Box layoutClassName="flex items-start justify-between gap-2">
                         <Box layoutClassName="min-w-0">
                           <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-emerald-600 dark:text-emerald-400">Khuyến mãi</Typography>
                           {(currentOrder.appliedPromotions ?? []).map((ap) => (
                             <Typography key={ap.promotionId} as="p" size="xs" textClassName="text-slate-500 dark:text-slate-400">• {ap.name}</Typography>
                           ))}
                         </Box>
                         <Typography as="span" size="sm" layoutClassName="shrink-0 font-medium" textClassName="text-emerald-600 dark:text-emerald-400">−{formatVND(currentOrder.discountAmount)}</Typography>
                       </Box>
                     ) : null}
                     <Box layoutClassName="flex justify-between items-center pt-2" borderClassName="border-t border-slate-50 dark:border-slate-700">
                       <Typography as="span" size="inherit" layoutClassName="font-medium" textClassName="text-slate-900 dark:text-white">{t('detail.total')}</Typography>
                       <Typography as="span" size="lg" layoutClassName="font-bold" textClassName="text-primary-600 dark:text-primary-400">{formatVND(finalTotal)}</Typography>
                     </Box>
                   </Box>
                </Box>

                {/* STATUS STEPPER CARD */}
                <Box
                  layoutClassName="p-5"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                  shadowClassName="shadow-sm"
                  stateClassName="transition-colors"
                >
                  <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <StickyNote className="w-4 h-4" />
                    {t('orders.tableStatus')}
                  </Heading>

                  {currentOrder.status === OrderStatus.CANCELLED || currentOrder.status === OrderStatus.RETURNED ? (
                    /* Terminal state banner */
                    <Box
                      layoutClassName="flex flex-col items-center gap-3 p-5"
                      roundedClassName="rounded-xl"
                      borderClassName={
                        currentOrder.status === OrderStatus.CANCELLED
                          ? 'border border-red-200 dark:border-red-800'
                          : 'border border-primary-200 dark:border-primary-800'
                      }
                      backgroundClassName={
                        currentOrder.status === OrderStatus.CANCELLED
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-primary-50 dark:bg-primary-900/20'
                      }
                    >
                      <Typography
                        as="span"
                        size="base"
                        layoutClassName="font-bold"
                        textClassName={
                          currentOrder.status === OrderStatus.CANCELLED
                            ? 'text-red-700 dark:text-red-200'
                            : 'text-primary-700 dark:text-primary-200'
                        }
                      >
                        {t(`orders.statusLabels.${currentOrder.status}`)}
                      </Typography>
                      <Typography as="span" size="xs" layoutClassName="text-center" textClassName="text-slate-500 dark:text-slate-400">
                        {currentOrder.status === OrderStatus.CANCELLED
                          ? 'Đơn này đã bị huỷ. Bấm "Khôi phục" để đưa về trạng thái Chờ xử lý.'
                          : 'Đơn này đã được trả hàng. Bấm "Khôi phục" để đưa về trạng thái Chờ xử lý.'}
                      </Typography>
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
                    </Box>
                  ) : (
                    /* Stepper for happy path: PENDING -> PROCESSING -> DELIVERED */
                    (() => {
                      const HAPPY_PATH = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.DELIVERED];
                      const currentIdx = HAPPY_PATH.indexOf(currentOrder.status);
                      const nextStatus = currentIdx >= 0 && currentIdx < HAPPY_PATH.length - 1 ? HAPPY_PATH[currentIdx + 1] : null;
                      return (
                        <>
                          <Box layoutClassName="flex items-center justify-between gap-1 sm:gap-2">
                            {HAPPY_PATH.map((step, idx, arr) => {
                              const isActive = currentOrder.status === step;
                              const isPast = currentIdx > idx;
                              const isReached = isActive || isPast;
                              const baseCircle = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all';
                              const circleCls = isReached
                                ? 'bg-primary-500 text-white shadow-sm shadow-primary-300 dark:bg-primary-500 dark:shadow-none'
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
                                    <Typography as="span" size="inherit" layoutClassName={baseCircle} className={circleCls}>
                                      {idx + 1}
                                    </Typography>
                                    <Typography as="span" size="inherit" layoutClassName="text-[11px] sm:text-xs text-center whitespace-nowrap" className={labelCls}>
                                      {t(`orders.statusLabels.${step}`)}
                                    </Typography>
                                  </Button>
                                  {idx < arr.length - 1 ? (
                                    <Box
                                      layoutClassName="mb-5 h-1 flex-1"
                                      roundedClassName="rounded-full"
                                      backgroundClassName={isPast ? 'bg-primary-500 dark:bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}
                                    />
                                  ) : null}
                                </React.Fragment>
                              );
                            })}
                          </Box>

                          {canEdit ? (
                            <Box
                              layoutClassName="mt-5 flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between"
                              borderClassName="border-t border-slate-100 dark:border-slate-700"
                            >
                              <Box layoutClassName="flex flex-wrap items-center gap-2">
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
                              </Box>
                              {nextStatus ? (
                                <Button
                                  type="button"
                                  variant="primary"
                                  disableVariantHover
                                  onClick={() => handleUpdateField({ status: nextStatus }, setUpdatingStatus)}
                                  disabled={updatingStatus}
                                  sizeClassName="px-4 py-2"
                                  textClassName="text-sm font-semibold text-white"
                                  backgroundClassName="bg-primary-500 dark:bg-primary-500"
                                  hoverClassName="hover:bg-primary-600 dark:hover:bg-primary-600"
                                  shadowClassName="shadow-sm shadow-primary-300 dark:shadow-none"
                                  roundedClassName="rounded-lg"
                                  stateClassName="transition-colors"
                                >
                                  Chuyển sang {t(`orders.statusLabels.${nextStatus}`)}
                                  <Typography as="span" size="inherit" aria-hidden="true">→</Typography>
                                </Button>
                              ) : (
                                <Box
                                  layoutClassName="inline-flex items-center justify-center gap-2 px-4 py-2"
                                  roundedClassName="rounded-lg"
                                  backgroundClassName="bg-emerald-50 dark:bg-emerald-900/30"
                                  textClassName="text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                                >
                                  ✓ Đơn đã hoàn tất
                                </Box>
                              )}
                            </Box>
                          ) : null}
                        </>
                      );
                    })()
                  )}
                </Box>

                <Box
                  layoutClassName="p-5"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                  shadowClassName="shadow-sm"
                  stateClassName="transition-colors"
                >
                   <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 uppercase tracking-wide">{t('detail.fulfillment')}</Heading>
                   <Box layoutClassName="flex flex-col gap-3">
                      <Box
                        layoutClassName="flex justify-between items-center p-3"
                        backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-slate-100 dark:border-slate-700"
                      >
                        <Box layoutClassName="flex items-center gap-3">
                          <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">Order Number</Typography>
                        </Box>
                        <Typography as="span" size="sm" layoutClassName="font-mono font-medium" textClassName="text-slate-900 dark:text-white">{currentOrder.orderNumber || t('detail.notAssigned')}</Typography>
                      </Box>
                      <Box
                        layoutClassName="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3"
                        backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-slate-100 dark:border-slate-700"
                      >
                        <Box layoutClassName="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{t('detail.payment')}</Typography>
                        </Box>
                        <Box layoutClassName="flex items-center gap-2 flex-wrap">
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
                        </Box>
                      </Box>
                      <Box
                        layoutClassName="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3"
                        backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-slate-100 dark:border-slate-700"
                      >
                        <Box layoutClassName="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{t('detail.paymentMethod')}</Typography>
                        </Box>
                        <Box layoutClassName="flex items-center gap-2 flex-wrap">
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
                        </Box>
                      </Box>
                      {/* Delivery type row */}
                      <Box
                        layoutClassName="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3"
                        backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-slate-100 dark:border-slate-700"
                      >
                        <Box layoutClassName="flex items-center gap-3">
                          {currentOrder.deliveryType === DeliveryType.PICKUP
                            ? <Store className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            : currentOrder.deliveryType === DeliveryType.SHIP_PROVINCE
                              ? <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              : <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{t('deliveryType.label')}</Typography>
                        </Box>
                        <Box layoutClassName="flex items-center gap-2 flex-wrap">
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
                                  ? 'text-xs font-semibold text-primary-700 dark:text-primary-200'
                                  : 'text-xs font-semibold text-slate-500 dark:text-slate-300'}
                                backgroundClassName={isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/30'
                                  : 'bg-white dark:bg-slate-800'}
                                borderClassName={isActive
                                  ? 'border border-primary-300 dark:border-primary-700'
                                  : 'border border-slate-200 dark:border-slate-600'}
                                hoverClassName={isActive ? '' : 'hover:border-primary-300'}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </Box>
                      </Box>

                      <Box
                        layoutClassName="flex justify-between items-center p-3"
                        backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-slate-100 dark:border-slate-700"
                      >
                        <Box layoutClassName="flex items-center gap-3">
                          <Receipt className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{t('detail.transactionNumber')}</Typography>
                        </Box>
                        <Typography as="span" size="sm" layoutClassName="font-mono font-medium" textClassName="text-slate-900 dark:text-white">
                            {currentOrder.sepayId ? `#${currentOrder.sepayId}` : t('detail.notAssigned')}
                        </Typography>
                      </Box>
                   </Box>
                </Box>

                {/* Payment QR Section — hiển thị khi có URL hợp lệ (config đủ số TK/bank); ẩn nếu thiếu để không vỡ ảnh */}
                {qrUrl && activeAccount ? (
                  <Box
                    layoutClassName="p-5 animate-fade-in"
                    backgroundClassName="bg-white dark:bg-slate-800"
                    roundedClassName="rounded-xl"
                    borderClassName="border border-slate-100 dark:border-slate-700"
                    shadowClassName="shadow-sm"
                    stateClassName="transition-colors"
                  >
                     <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white" layoutClassName="mb-4 uppercase tracking-wide">{t('qr.sectionTitle')}</Heading>
                     <Box
                       layoutClassName="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start"
                       backgroundClassName="bg-blue-50 dark:bg-blue-900/20"
                       borderClassName="border border-blue-100 dark:border-blue-800"
                       roundedClassName="rounded-xl"
                     >
                        <Box
                          layoutClassName="shrink-0 p-2"
                          backgroundClassName="bg-white"
                          roundedClassName="rounded-lg"
                          borderClassName="border border-slate-200"
                          shadowClassName="shadow-sm"
                        >
                            <Image
                              src={qrUrl}
                              alt="Payment QR"
                              layoutClassName="w-32 h-32 object-contain"
                            />
                        </Box>

                        <Box layoutClassName="flex-1 space-y-2 w-full text-center sm:text-left">
                            <Box layoutClassName="flex items-center justify-center sm:justify-start gap-2 font-semibold" textClassName="text-blue-800 dark:text-blue-300">
                              <QrCode className="w-4 h-4" />
                              <Typography as="span" size="inherit">{t('qr.title')}</Typography>
                            </Box>

                            <Box layoutClassName="space-y-1" textClassName="text-sm text-slate-600 dark:text-slate-400">
                              <Box
                                layoutClassName="flex justify-between sm:justify-start sm:gap-4 items-center px-3 py-1.5"
                                backgroundClassName="bg-white dark:bg-slate-800"
                                roundedClassName="rounded"
                                borderClassName="border border-slate-200 dark:border-slate-700"
                              >
                                  <Typography as="span" size="xs" layoutClassName="uppercase font-medium min-w-[60px]" textClassName="text-slate-500">{t('qr.bank')}</Typography>
                                  <Typography as="span" size="inherit" layoutClassName="font-bold" textClassName="text-slate-800 dark:text-slate-200">{activeAccount.bankCode}</Typography>
                              </Box>
                              <Box
                                layoutClassName="flex justify-between sm:justify-start sm:gap-4 items-center px-3 py-1.5 group cursor-pointer"
                                backgroundClassName="bg-white dark:bg-slate-800"
                                roundedClassName="rounded"
                                borderClassName="border border-slate-200 dark:border-slate-700"
                                onClick={() => copyToClipboard(activeAccount.accountNumber)}
                              >
                                  <Typography as="span" size="xs" layoutClassName="uppercase font-medium min-w-[60px]" textClassName="text-slate-500">{t('qr.account')}</Typography>
                                  <Box layoutClassName="flex items-center gap-2">
                                    <Typography as="span" size="inherit" layoutClassName="font-bold font-mono" textClassName="text-slate-800 dark:text-slate-200">{activeAccount.accountNumber}</Typography>
                                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                  </Box>
                              </Box>
                              <Box
                                layoutClassName="flex justify-between sm:justify-start sm:gap-4 items-center px-3 py-1.5"
                                backgroundClassName="bg-white dark:bg-slate-800"
                                roundedClassName="rounded"
                                borderClassName="border border-slate-200 dark:border-slate-700"
                              >
                                  <Typography as="span" size="xs" layoutClassName="uppercase font-medium min-w-[60px]" textClassName="text-slate-500">{t('qr.accountName')}</Typography>
                                  <Typography as="span" size="inherit" layoutClassName="font-bold uppercase" textClassName="text-slate-800 dark:text-slate-200">{activeAccount.accountHolder}</Typography>
                              </Box>
                              <Box
                                layoutClassName="flex justify-between sm:justify-start sm:gap-4 items-center px-3 py-1.5"
                                backgroundClassName="bg-white dark:bg-slate-800"
                                roundedClassName="rounded"
                                borderClassName="border border-slate-200 dark:border-slate-700"
                              >
                                  <Typography as="span" size="xs" layoutClassName="uppercase font-medium min-w-[60px]" textClassName="text-slate-500">{t('qr.amount')}</Typography>
                                  <Typography as="span" size="inherit" layoutClassName="font-bold" textClassName="text-primary-600 dark:text-primary-400">
                                    {formatVND(finalTotal)}
                                  </Typography>
                              </Box>
                              <Box
                                layoutClassName="flex justify-between sm:justify-start sm:gap-4 items-center px-3 py-1.5"
                                backgroundClassName="bg-white dark:bg-slate-800"
                                roundedClassName="rounded"
                                borderClassName="border border-slate-200 dark:border-slate-700"
                              >
                                  <Typography as="span" size="xs" layoutClassName="uppercase font-medium min-w-[60px]" textClassName="text-slate-500">{t('qr.content')}</Typography>
                                  <Typography as="span" size="inherit" layoutClassName="font-bold break-all" textClassName="text-slate-800 dark:text-slate-200">
                                    {description}
                                  </Typography>
                              </Box>
                            </Box>
                            <Typography as="p" size="inherit" layoutClassName="text-[10px] mt-2" textClassName="text-slate-400">
                               {t('qr.instruction')}
                            </Typography>
                        </Box>
                     </Box>
                  </Box>
                ) : null}

              </Box>
            ) : activeTab === 'refund' ? (
              /* REFUND TAB (#186) — tách từ tab Chi tiết; rỗng → EmptyState */
              Array.isArray(currentOrder.refunds) && currentOrder.refunds.length > 0 ? (
                <Box layoutClassName="space-y-6">
                  <Box
                    layoutClassName="rounded-xl border p-5"
                    backgroundClassName="bg-white dark:bg-slate-800"
                    borderClassName="border-amber-200 dark:border-amber-800"
                    shadowClassName="shadow-sm"
                    stateClassName="transition-colors"
                  >
                    <Heading
                      level={3}
                      textClassName="text-sm font-semibold text-slate-900 dark:text-white"
                      layoutClassName="mb-4 flex items-center gap-2 uppercase tracking-wide"
                    >
                      <Wallet className="h-4 w-4 text-amber-600" />
                      {t('refund.historyTitle')}
                      {typeof currentOrder.refundedAmount === 'number' && currentOrder.refundedAmount > 0 ? (
                        <Typography
                          as="span"
                          size="xs"
                          layoutClassName="ml-auto font-bold"
                          textClassName="text-amber-700 dark:text-amber-300"
                        >
                          {t('refund.totalRefunded')}: {formatVND(currentOrder.refundedAmount)}
                        </Typography>
                      ) : null}
                    </Heading>
                    <Box layoutClassName="space-y-3">
                      {currentOrder.refunds.map((rf) => {
                        const at = (rf.createdAt as any)?.toDate
                          ? (rf.createdAt as any).toDate()
                          : rf.createdAt
                            ? new Date(rf.createdAt as any)
                            : null;
                        const atLabel =
                          at && !isNaN(at.getTime())
                            ? at.toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—';
                        const reconciled = rf.reconciled === true;
                        const method = rf.reconcileMethod ?? null;
                        const linkedTx = rf.transactionId
                          ? relatedTransactions.find((tx) => tx.id === rf.transactionId)
                          : undefined;
                        const isBusy = reconcilingId === rf.id;
                        const isPickerOpen = pickerRefundId === rf.id;
                        return (
                          <Box
                            key={rf.id}
                            layoutClassName="rounded-lg border p-3"
                            borderClassName="border-amber-100 dark:border-amber-900/50"
                            backgroundClassName="bg-amber-50/60 dark:bg-amber-950/30"
                          >
                            <Box layoutClassName="flex items-center justify-between gap-2">
                              <Typography size="xs" variant="muted">
                                {atLabel}
                                {rf.createdBy ? ` • ${rf.createdBy}` : ''}
                              </Typography>
                              <Typography
                                size="sm"
                                layoutClassName="font-bold"
                                textClassName="text-amber-700 dark:text-amber-300"
                              >
                                {formatVND(rf.amount)}
                              </Typography>
                            </Box>
                            {rf.reason ? (
                              <Typography size="xs" variant="muted" layoutClassName="mt-1">
                                {t('refund.reasonLabel')}: {rf.reason}
                              </Typography>
                            ) : null}
                            {Array.isArray(rf.items) && rf.items.length > 0 ? (
                              <Box layoutClassName="mt-2 space-y-1 border-t border-amber-100 pt-2 dark:border-amber-900/50">
                                {rf.items.map((it, idx) => (
                                  <Box
                                    key={`${rf.id}-${idx}`}
                                    layoutClassName="flex items-center justify-between gap-2"
                                  >
                                    <Typography size="xs" textClassName="text-slate-700 dark:text-slate-300">
                                      {it.productName}
                                      <Typography
                                        as="span"
                                        size="xs"
                                        layoutClassName="ml-1.5"
                                        textClassName="text-slate-400 dark:text-slate-500"
                                      >
                                        −{it.qtyRefunded} × {formatVND(it.unitPrice)}
                                      </Typography>
                                    </Typography>
                                    <Typography size="xs" textClassName="text-slate-600 dark:text-slate-400">
                                      {formatVND(it.amount)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            ) : null}

                            {/* ── Đối soát (#186) ── */}
                            <Box layoutClassName="mt-3 border-t border-amber-100 pt-3 dark:border-amber-900/50">
                              <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
                                {/* Badge trạng thái */}
                                {reconciled && method === 'sepay' ? (
                                  <Badge
                                    size="sm"
                                    borderClassName="border-emerald-200 dark:border-emerald-800"
                                    backgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
                                    textClassName="text-emerald-700 dark:text-emerald-300"
                                  >
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    {t('reconcile.badgeSepay')}
                                  </Badge>
                                ) : reconciled && method === 'cash' ? (
                                  <Badge
                                    size="sm"
                                    borderClassName="border-slate-200 dark:border-slate-700"
                                    backgroundClassName="bg-slate-100 dark:bg-slate-700/40"
                                    textClassName="text-slate-600 dark:text-slate-300"
                                  >
                                    <Banknote className="h-3.5 w-3.5" />
                                    {t('reconcile.badgeCash')}
                                  </Badge>
                                ) : (
                                  <Badge
                                    size="sm"
                                    borderClassName="border-amber-300 dark:border-amber-700"
                                    backgroundClassName="bg-amber-100 dark:bg-amber-900/40"
                                    textClassName="text-amber-700 dark:text-amber-300"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    {t('reconcile.badgeUnreconciled')}
                                  </Badge>
                                )}

                                {/* Hành động (chỉ Admin/Super Admin) */}
                                {canReconcile ? (
                                  reconciled ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isBusy}
                                      leftIcon={
                                        isBusy ? (
                                          <Spinner size="sm" />
                                        ) : (
                                          <Unlink className="h-3.5 w-3.5" />
                                        )
                                      }
                                      onClick={() => handleUnreconcile(rf.id)}
                                    >
                                      {t('reconcile.unlinkCta')}
                                    </Button>
                                  ) : (
                                    <Box layoutClassName="flex items-center gap-2">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={isBusy}
                                        leftIcon={<Link2 className="h-3.5 w-3.5" />}
                                        onClick={() => handleOpenPicker(rf.id)}
                                      >
                                        {t('reconcile.sepayCta')}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isBusy}
                                        leftIcon={
                                          isBusy ? (
                                            <Spinner size="sm" />
                                          ) : (
                                            <Banknote className="h-3.5 w-3.5" />
                                          )
                                        }
                                        onClick={() => handleReconcileCash(rf.id)}
                                      >
                                        {t('reconcile.cashCta')}
                                      </Button>
                                    </Box>
                                  )
                                ) : null}
                              </Box>

                              {/* Chi tiết GD đã gắn khi đã đối soát SePay */}
                              {reconciled && method === 'sepay' ? (
                                <Typography size="xs" variant="muted" layoutClassName="mt-1.5">
                                  {t('reconcile.linkedTx')}:{' '}
                                  <Typography
                                    as="span"
                                    size="xs"
                                    layoutClassName="font-semibold"
                                    textClassName="text-slate-700 dark:text-slate-300"
                                  >
                                    {linkedTx
                                      ? `#${linkedTx.sepayId} • ${formatVND(linkedTx.transferAmount)}`
                                      : rf.transactionId}
                                  </Typography>
                                  {rf.reconciledBy ? ` • ${rf.reconciledBy}` : ''}
                                </Typography>
                              ) : reconciled && method === 'cash' ? (
                                <Typography size="xs" variant="muted" layoutClassName="mt-1.5">
                                  {reconcileMethodLabel(method)}
                                  {rf.reconciledBy ? ` • ${rf.reconciledBy}` : ''}
                                </Typography>
                              ) : null}

                              {/* Panel chọn GD SePay tiền ra để gắn */}
                              {isPickerOpen && !reconciled ? (
                                <Box
                                  layoutClassName="mt-3 space-y-2 rounded-lg border p-3"
                                  borderClassName="border-slate-200 dark:border-slate-700"
                                  backgroundClassName="bg-white dark:bg-slate-800"
                                >
                                  <Typography
                                    size="xs"
                                    layoutClassName="font-semibold uppercase tracking-wide"
                                    textClassName="text-slate-600 dark:text-slate-300"
                                  >
                                    {t('reconcile.pickerTitle')}
                                  </Typography>
                                  {outTxLoading ? (
                                    <Box layoutClassName="flex items-center justify-center gap-2 py-4">
                                      <Spinner size="sm" textClassName="text-slate-400" />
                                      <Typography size="xs" variant="muted">
                                        {t('reconcile.loadingTx')}
                                      </Typography>
                                    </Box>
                                  ) : outTx.length === 0 ? (
                                    <EmptyState
                                      icon={<Wallet className="h-6 w-6" />}
                                      title={t('reconcile.noOutTx')}
                                      layoutClassName="!min-h-0"
                                    />
                                  ) : (
                                    <Box layoutClassName="max-h-56 space-y-1.5 overflow-y-auto">
                                      {outTx.map((tx) => {
                                        const amountMatch =
                                          tx.transferAmount === rf.amount;
                                        const txAt = tx.transactionDate
                                          ? new Date(tx.transactionDate)
                                          : tx.receivedAt
                                            ? new Date(tx.receivedAt)
                                            : null;
                                        const txAtLabel =
                                          txAt && !isNaN(txAt.getTime())
                                            ? txAt.toLocaleString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })
                                            : '—';
                                        return (
                                          <Box
                                            key={tx.id}
                                            layoutClassName="flex items-center justify-between gap-2 rounded-md border p-2"
                                            borderClassName={
                                              amountMatch
                                                ? 'border-emerald-300 dark:border-emerald-700'
                                                : 'border-slate-100 dark:border-slate-700'
                                            }
                                            backgroundClassName={
                                              amountMatch
                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                                : 'bg-slate-50/60 dark:bg-slate-700/20'
                                            }
                                          >
                                            <Box layoutClassName="min-w-0">
                                              <Typography
                                                size="xs"
                                                layoutClassName="font-semibold"
                                                textClassName="text-slate-800 dark:text-slate-200"
                                              >
                                                #{tx.sepayId} • {formatVND(tx.transferAmount)}
                                                {amountMatch ? (
                                                  <Typography
                                                    as="span"
                                                    size="xs"
                                                    layoutClassName="ml-1.5 font-medium"
                                                    textClassName="text-emerald-600 dark:text-emerald-400"
                                                  >
                                                    • {t('reconcile.amountMatch')}
                                                  </Typography>
                                                ) : null}
                                              </Typography>
                                              <Typography size="xs" variant="muted">
                                                {txAtLabel}
                                                {tx.referenceCode ? ` • ${tx.referenceCode}` : ''}
                                              </Typography>
                                            </Box>
                                            <Button
                                              variant="primary"
                                              size="sm"
                                              disabled={isBusy}
                                              leftIcon={
                                                isBusy ? (
                                                  <Spinner size="sm" />
                                                ) : (
                                                  <Check className="h-3.5 w-3.5" />
                                                )
                                              }
                                              onClick={() =>
                                                handleReconcileSepay(rf.id, tx.id)
                                              }
                                            >
                                              {t('reconcile.pickCta')}
                                            </Button>
                                          </Box>
                                        );
                                      })}
                                    </Box>
                                  )}
                                </Box>
                              ) : null}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <EmptyState
                  icon={<Wallet className="h-6 w-6" />}
                  title={t('refund.emptyTitle')}
                />
              )
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
                    borderClass: 'border-primary-200 dark:border-primary-800',
                    iconBgClass: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
                    dotClass: 'bg-primary-500', dotRingClass: 'ring-primary-200 dark:ring-primary-900' },
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
                  <Box layoutClassName="space-y-4">
                    {CATEGORY_META.map((meta) => {
                      const Icon = meta.icon;
                      const items = groups[meta.key];
                      const isEmpty = items.length === 0;
                      return (
                        <Box
                          key={meta.key}
                          layoutClassName="p-5"
                          roundedClassName="rounded-xl"
                          borderClassName={`border-2 ${meta.borderClass}`}
                          backgroundClassName="bg-white dark:bg-slate-800"
                          shadowClassName="shadow-sm"
                          stateClassName="transition-colors"
                        >
                          {/* Category header */}
                          <Box layoutClassName="mb-4 flex items-center gap-3">
                            <Typography as="span" size="inherit" layoutClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" backgroundClassName={meta.iconBgClass}>
                              <Icon className="h-5 w-5" />
                            </Typography>
                            <Box layoutClassName="min-w-0 flex-1">
                              <Box layoutClassName="text-sm font-bold uppercase tracking-wide" textClassName="text-slate-900 dark:text-white">
                                {meta.title}
                              </Box>
                              <Box layoutClassName="text-xs" textClassName="text-slate-500 dark:text-slate-400">
                                {isEmpty ? 'Chưa có thay đổi' : `${items.length} thay đổi`}
                              </Box>
                            </Box>
                          </Box>

                          {isEmpty ? (
                            /* Empty placeholder */
                            <EmptyState
                              icon={<Clock className="h-6 w-6" />}
                              title="Chưa có lịch sử cho mục này"
                              layoutClassName="!min-h-0"
                            />
                          ) : (
                            /* Timeline */
                            <Box
                              layoutClassName="relative space-y-4 pl-5"
                              borderClassName="border-l-2 border-slate-200 dark:border-slate-700"
                            >
                              {items.map((g, ci) => {
                                const at = g.entry?.at?.toDate ? g.entry.at.toDate() : new Date(g.entry?.at);
                                const atLabel = at && !isNaN(at.getTime())
                                  ? at.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : '—';
                                return (
                                  <Box key={ci} layoutClassName="relative">
                                    <Typography as="span" size="inherit" layoutClassName="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ring-2 dark:border-slate-800" backgroundClassName={meta.dotClass} stateClassName={meta.dotRingClass} />
                                    <Box layoutClassName="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                      <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">
                                        {g.entry?.byUid === 'system'
                                          ? (g.entry?.by || 'System')
                                          : (g.entry?.by || 'Unknown')}
                                      </Typography>
                                      {g.entry?.byUid === 'system' ? (
                                        <Box
                                          layoutClassName="px-1.5 py-0.5"
                                          roundedClassName="rounded-full"
                                          backgroundClassName="bg-indigo-100 dark:bg-indigo-900/40"
                                          textClassName="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-200"
                                        >
                                          AUTO
                                        </Box>
                                      ) : null}
                                      <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">
                                        {atLabel}
                                      </Typography>
                                    </Box>
                                    <Box
                                      layoutClassName="mt-2 flex flex-wrap items-center gap-2 p-2 text-xs"
                                      roundedClassName="rounded-md"
                                      borderClassName="border border-slate-100 dark:border-slate-700"
                                      backgroundClassName="bg-slate-50/70 dark:bg-slate-700/30"
                                    >
                                      <Box
                                        layoutClassName="px-1.5 py-0.5 font-semibold"
                                        roundedClassName="rounded"
                                        backgroundClassName="bg-slate-200 dark:bg-slate-600"
                                        textClassName="text-slate-700 dark:text-slate-200"
                                      >
                                        {g.change.label || g.change.field}
                                      </Box>
                                      <Typography as="span" size="inherit" layoutClassName="line-through break-all" textClassName="text-slate-500 dark:text-slate-400">
                                        {formatHistoryValue(g.change.field, g.change.oldValue)}
                                      </Typography>
                                      <Typography as="span" size="inherit" textClassName="text-slate-400" aria-hidden="true">→</Typography>
                                      <Typography as="span" size="inherit" layoutClassName="font-semibold break-all" textClassName="text-primary-700 dark:text-primary-300">
                                        {formatHistoryValue(g.change.field, g.change.newValue)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()
            ) : null}
        </Box>
      </Box>
    </BaseSlidePanel>

    <CancelRefundModal
      open={crMode !== null}
      mode={crMode ?? 'cancel'}
      order={currentOrder}
      onClose={() => setCrMode(null)}
      onConfirm={handleCancelRefund}
    />

    {/* Modal preview ảnh đơn (mobile / khi clipboard không khả dụng).
        z-index cao hơn slide panel chi tiết để nổi trên cùng. */}
    {previewUrl ? (
      <Box
        layoutClassName="fixed inset-0 z-[120] flex items-center justify-center p-4"
        onClick={closePreview}
      >
        <Box
          layoutClassName="absolute inset-0"
          backgroundClassName="bg-black/60"
          aria-hidden
        />
        <Box
          layoutClassName="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl"
          backgroundClassName="bg-white dark:bg-slate-800"
          shadowClassName="shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Box
            layoutClassName="flex items-center justify-between gap-3 border-b px-4 py-3"
            borderClassName="border-slate-200 dark:border-slate-700"
          >
            <Heading level={3} textClassName="text-base font-semibold text-slate-800 dark:text-slate-100">
              {t('detail.previewTitle') || 'Ảnh đơn — copy hoặc chụp màn hình để gửi khách'}
            </Heading>
            <IconButton
              type="button"
              layoutClassName="p-1.5"
              roundedClassName="rounded-lg"
              hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
              textClassName="text-slate-400 dark:text-slate-300"
              onClick={closePreview}
              label={t('detail.close')}
            >
              <X className="h-5 w-5" />
            </IconButton>
          </Box>

          {/* Ảnh + hint (scrollable) */}
          <Box layoutClassName="flex-1 space-y-3 overflow-y-auto p-4">
            <Image
              src={previewUrl}
              alt={currentOrder.orderNumber || 'don-hang'}
              disableFade
              loading="eager"
              layoutClassName="mx-auto h-auto max-w-full rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-700"
            />
            <Typography as="p" size="xs" layoutClassName="text-center" textClassName="text-slate-500 dark:text-slate-400">
              {t('detail.previewHint') || 'Bấm Copy, hoặc chụp màn hình khung này để gửi khách'}
            </Typography>
          </Box>

          {/* Footer */}
          <Box
            layoutClassName="flex flex-wrap justify-end gap-3 border-t px-4 py-3"
            borderClassName="border-slate-200 dark:border-slate-700"
          >
            <Button
              type="button"
              onClick={copyPreviewImage}
              disabled={copyingPreview}
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-primary-200 dark:border-primary-700/50"
              backgroundClassName="bg-primary-600 dark:bg-primary-500"
              hoverClassName="hover:bg-primary-700 dark:hover:bg-primary-600"
              textClassName="text-sm font-medium text-white"
              roundedClassName="rounded-lg"
              layoutClassName="mr-auto px-4 py-2"
              stateClassName="transition-colors disabled:opacity-50"
              leftIcon={<Copy className="h-4 w-4" />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            >
              {t('detail.copyImage') || 'Copy ảnh'}
            </Button>
            <Button
              type="button"
              onClick={downloadPreview}
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-primary-200 dark:border-primary-700/50"
              backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
              hoverClassName="hover:bg-primary-100 dark:hover:bg-primary-900/30"
              textClassName="text-sm font-medium text-primary-700 dark:text-primary-300"
              roundedClassName="rounded-lg"
              layoutClassName="px-4 py-2"
            >
              {t('detail.previewDownload') || 'Tải ảnh'}
            </Button>
            <Button
              type="button"
              onClick={closePreview}
              variant="secondary"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-transparent"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
              textClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
              roundedClassName="rounded-lg"
              layoutClassName="px-4 py-2"
            >
              {t('detail.close') || 'Đóng'}
            </Button>
          </Box>
        </Box>
      </Box>
    ) : null}

    {/* Thẻ gửi khách render OFF-SCREEN để chụp ảnh (html-to-image). Không hiển thị cho user. */}
    <Box layoutClassName="pointer-events-none fixed left-[-99999px] top-0" aria-hidden>
      <ShareableOrderCard
        ref={shareRef}
        order={currentOrder}
        subtotal={subtotal}
        finalTotal={finalTotal}
        shippingCost={shippingCost}
        surchargeLabel={surchargeTagLabel(currentOrder.surchargeTag, surchargeTags)}
        deliveryLabel={
          currentOrder.deliveryType === DeliveryType.PICKUP ? t('deliveryType.pickup')
          : currentOrder.deliveryType === DeliveryType.SHIP_PROVINCE ? t('deliveryType.shipProvince')
          : currentOrder.deliveryType === DeliveryType.SHIP ? t('deliveryType.ship') : ''
        }
        paymentLabel={
          currentOrder.paymentMethod === PaymentMethod.CASH ? t('paymentMethod.cash')
          : currentOrder.paymentMethod === PaymentMethod.BANKING ? t('paymentMethod.banking') : ''
        }
        qrUrl={qrUrl}
        description={description}
        bankCode={activeAccount?.bankCode}
        accountNumber={activeAccount?.accountNumber}
        accountHolder={activeAccount?.accountHolder}
      />
    </Box>
    </>
  );
};

export default OrderDetail;
