import React, { useState } from 'react';
import { Download, Package, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/contexts/OrderContext';
import { Order } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import ExportModal from '@/pages/Orders/components/modals/ExportModal';
import OrderDetail from '@/pages/Orders/components/modals/OrderDetail';
import OrderForm from '@/pages/Orders/components/modals/OrderForm';
import OrderList from '@/pages/Orders/components/OrderList';

const OrdersPage: React.FC = () => {
  const { orders, createNewOrder, modifyOrder, removeOrder, refreshOrders } = useOrders();
  const { t } = useLanguage();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const handleCreateNewOrder = () => {
    setEditingOrder(undefined);
    setIsOrderFormOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setSelectedOrder(null);
    setIsOrderFormOpen(true);
  };

  const handleDeleteClick = (orderId: string) => {
    setDeleteId(orderId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await removeOrder(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveOrder = async (data: any) => {
    if (data.id) {
      await modifyOrder(data.id, data);
    } else {
      await createNewOrder(data);
    }
    setIsOrderFormOpen(false);
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

  return (
    <Box layoutClassName="relative h-full">
      <Box layoutClassName="mb-4 flex flex-col items-center justify-end gap-3 sm:flex-row">
        <Box layoutClassName="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            backgroundClassName="bg-slate-100 dark:bg-slate-700"
            hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
            textClassName="text-sm font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            sizeClassName="px-3 py-2"
            layoutClassName="flex-1 gap-2 sm:flex-none"
            stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            leftIcon={<RefreshCw />}
            iconClassName={`inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4${isRefreshing ? ' [&_svg]:animate-spin' : ''}`}
          >
            <Typography as="span" size="sm" layoutClassName="hidden sm:inline">
              {t('orders.refresh')}
            </Typography>
          </Button>
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            backgroundClassName="bg-slate-100 dark:bg-slate-700"
            hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
            textClassName="text-sm font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            sizeClassName="px-3 py-2"
            layoutClassName="flex-1 gap-2 sm:flex-none"
            stateClassName="transition-colors"
            leftIcon={<Download />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          >
            {t('orders.exportCsv')}
          </Button>
          <Button
            type="button"
            onClick={handleCreateNewOrder}
            leftIcon={<Plus />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            backgroundClassName="bg-orange-600"
            hoverClassName="hover:bg-orange-700"
            textClassName="text-sm font-medium text-white"
            roundedClassName="rounded-lg"
            shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
            sizeClassName="px-3 py-2"
            layoutClassName="flex-1 gap-2 sm:flex-none"
            stateClassName="transition-colors"
            variant="primary"
            disableVariantHover
            disableVariantTextColor
          >
            {t('nav.newOrder')}
          </Button>
        </Box>
      </Box>

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
            backgroundClassName="bg-orange-600"
            hoverClassName="hover:bg-orange-700"
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
        />
      )}

      <OrderDetail
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onEdit={() => selectedOrder && handleEditOrder(selectedOrder)}
        onUpdateOrder={modifyOrder}
      />

      <OrderForm
        isOpen={isOrderFormOpen}
        initialData={editingOrder}
        onSave={handleSaveOrder}
        onCancel={() => setIsOrderFormOpen(false)}
      />

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} orders={orders} />

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
