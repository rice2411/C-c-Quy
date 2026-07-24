import React, { useEffect, useState } from 'react';
import { Download, Package, Plus, RefreshCw, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { Order } from '@/types';
import { UserRole } from '@/types/user';
import { ORDER_EDIT_DENIED, refreshOrderTracking } from '@/services/orderService';
import { userCanEditOrder } from '@/utils/order/orderUtils';
import ConfirmModal from '@/components/ConfirmModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import ExportModal from '@/pages/Orders/components/modals/ExportModal';
import TrackingImportModal from '@/pages/Orders/components/modals/TrackingImportModal';
import OrderDetail from '@/pages/Orders/components/modals/OrderDetail';
import OrderForm from '@/pages/Orders/components/modals/OrderForm';
import OrderList from '@/pages/Orders/components/OrderList';
import OrdersStats from '@/pages/Orders/components/OrdersStats';

const OrdersPage: React.FC = () => {
  const { userData } = useAuth();
  const { orders, createNewOrder, modifyOrder, removeOrder, refreshOrders } = useOrders();
  const { t } = useLanguage();
  const canPermanentDelete = userData?.role === UserRole.SUPER_ADMIN;
  const canExportOrders =
    userData?.role === UserRole.ADMIN || userData?.role === UserRole.SUPER_ADMIN;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);

  const handleRefreshTracking = async () => {
    setIsRefreshingTracking(true);
    try {
      const res = await refreshOrderTracking();
      toast.success(`Đã cập nhật ${res.updated}/${res.total} vận đơn`);
      await refreshOrders();
    } catch {
      toast.error('Cập nhật vận đơn thất bại');
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  // Auto-sync selectedOrder khi orders list refresh (sau update)
  useEffect(() => {
    if (!selectedOrder) return;
    const fresh = orders.find((o) => o.id === selectedOrder.id);
    if (fresh && fresh !== selectedOrder) {
      setSelectedOrder(fresh);
    }
  }, [orders]);

  const handleCreateNewOrder = () => {
    setEditingOrder(undefined);
    setIsOrderFormOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    if (!userCanEditOrder(userData, order)) {
      toast.error(t('orders.editDeniedCollaborator'));
      return;
    }
    setEditingOrder(order);
    setSelectedOrder(null);
    setIsOrderFormOpen(true);
  };

  const handleDeleteClick = (orderId: string) => {
    if (!canPermanentDelete) {
      return;
    }
    setDeleteId(orderId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await removeOrder(deleteId);
      setSelectedOrder(null);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveOrder = async (data: any) => {
    try {
      if (data.id) {
        await modifyOrder(data.id, data);
      } else {
        await createNewOrder(data);
      }
      setIsOrderFormOpen(false);
      setEditingOrder(undefined);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ORDER_EDIT_DENIED) {
        toast.error(t('orders.editDeniedCollaborator'));
      } else {
        console.error(e);
        toast.error(t('orders.refreshError'));
      }
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshOrders();
      toast.success(t('orders.refreshSuccess'));
    } catch (error) {
      console.error('Failed to refresh orders:', error);
      toast.error(t('orders.refreshError'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenExportModal = () => {
    if (!canExportOrders) {
      toast.error('Only admin or super admin can export orders');
      return;
    }
    setIsExportModalOpen(true);
  };

  const ordersActions = (
    <>
      <Button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-3 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        leftIcon={<RefreshCw />}
        iconClassName={`inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5${isRefreshing ? ' [&_svg]:animate-spin' : ''}`}
      >
        <Typography as="span" size="xs" layoutClassName="hidden sm:inline">
          {t('orders.refresh')}
        </Typography>
      </Button>
      <Button
        type="button"
        onClick={handleOpenExportModal}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-3 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors"
        leftIcon={<Download />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        {t('orders.exportCsv')}
      </Button>
      <Button
        type="button"
        onClick={() => setIsTrackingModalOpen(true)}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-3 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors"
        leftIcon={<Truck />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        <Typography as="span" size="xs" layoutClassName="hidden sm:inline">
          Đồng bộ vận đơn
        </Typography>
      </Button>
      <Button
        type="button"
        onClick={handleRefreshTracking}
        disabled={isRefreshingTracking}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-3 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        leftIcon={<RefreshCw />}
        iconClassName={`inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5${isRefreshingTracking ? ' [&_svg]:animate-spin' : ''}`}
      >
        <Typography as="span" size="xs" layoutClassName="hidden sm:inline">
          Cập nhật VĐ
        </Typography>
      </Button>
      <Button
        type="button"
        onClick={handleCreateNewOrder}
        leftIcon={<Plus />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        backgroundClassName="bg-primary-600"
        hoverClassName="hover:bg-primary-700"
        textClassName="font-medium text-white"
        roundedClassName="rounded-xl"
        shadowClassName="shadow-sm shadow-primary-200 dark:shadow-none"
        sizeClassName="px-4 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors"
        variant="primary"
        disableVariantHover
        disableVariantTextColor
      >
        {t('nav.newOrder')}
      </Button>
    </>
  );

  return (
    <Box layoutClassName="relative h-full">
      <OrdersStats orders={orders} />

      {orders.length === 0 ? (
        <Box
          layoutClassName="flex h-64 flex-col items-center justify-center"
          textClassName="text-slate-400 dark:text-slate-500"
        >
          <Package className="mb-4 h-16 w-16 opacity-20" />
          <Typography layoutClassName="mb-4">{t('orders.noOrders')}</Typography>
          <Button
            type="button"
            onClick={handleCreateNewOrder}
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="text-sm text-white"
            roundedClassName="rounded-lg"
            sizeClassName="px-4 py-2"
            stateClassName="transition-colors"
            variant="primary"
            disableVariantHover
            disableVariantTextColor
          >
            {t('orders.createFirst')}
          </Button>
        </Box>
      ) : (
        <OrderList
          orders={orders}
          onSelectOrder={handleOrderSelect}
          onDeleteOrder={handleDeleteClick}
          onUpdateOrder={modifyOrder}
          actions={ordersActions}
        />
      )}

      <OrderDetail
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        canEdit={selectedOrder ? userCanEditOrder(userData, selectedOrder) : false}
        onEdit={
          selectedOrder && userCanEditOrder(userData, selectedOrder)
            ? () => handleEditOrder(selectedOrder)
            : undefined
        }
        onDelete={() => selectedOrder && handleDeleteClick(selectedOrder.id)}
        canDelete={canPermanentDelete}
        onUpdateOrder={modifyOrder}
      />

      <OrderForm
        isOpen={isOrderFormOpen}
        initialData={editingOrder}
        onSave={handleSaveOrder}
        onCancel={() => setIsOrderFormOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        orders={orders}
        userRole={userData?.role}
      />

      <TrackingImportModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        onApplied={() => { void refreshOrders(); }}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('orders.delete')}
        message={t('orders.confirmDelete')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default OrdersPage;
