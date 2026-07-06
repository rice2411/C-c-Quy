import React, { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer } from '@/types';
import CustomerList from '@/pages/Customers/components/CustomerList';
import CustomerForm from '@/pages/Customers/components/CustomerForm';
import CustomerDetailPanel from '@/pages/Customers/components/CustomerDetailPanel';
import { parseDateValue } from '@/utils/format/dateUtil';
import { getNormalizedPhoneDigits } from '@/utils/validation/vietnameseMobilePhone';
import ConfirmModal from '@/components/ConfirmModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const CustomersPage: React.FC = () => {
  const { customers, loading, createNewCustomer, modifyCustomer, removeCustomer } = useCustomers();
  const { orders } = useOrders();
  const { t } = useLanguage();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [detailCustomer, setDetailCustomer] = useState<Customer | undefined>(undefined);

  const ordersForDetailCustomer = useMemo(() => {
    if (!detailCustomer) return [];
    const key = getNormalizedPhoneDigits(detailCustomer.phone);
    if (!key) return [];
    return orders
      .filter((o) => getNormalizedPhoneDigits(o.customer.phone) === key)
      .sort((a, b) => {
        const ta = parseDateValue(a.orderDate || a.date)?.getTime() ?? 0;
        const tb = parseDateValue(b.orderDate || b.date)?.getTime() ?? 0;
        return tb - ta;
      });
  }, [orders, detailCustomer]);

  const customerStats = useMemo(() => {
    const stats = new Map<string, number>();
    orders.forEach((order) => {
      const phone = getNormalizedPhoneDigits(order.customer.phone);
      if (!phone) return;

      const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      const current = stats.get(phone) || 0;
      stats.set(phone, current + itemCount);
    });
    return stats;
  }, [orders]);

  const withOrderHistory = useMemo(
    () =>
      customers.filter((c) => {
        const key = getNormalizedPhoneDigits(c.phone);
        return key.length > 0 && (customerStats.get(key) ?? 0) > 0;
      }).length,
    [customers, customerStats]
  );

  const handleCreate = () => {
    setEditingCustomer(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await removeCustomer(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (data: any) => {
    if (data.id) {
      await modifyCustomer(data.id, data);
    } else {
      const { id: _id, ...customerData } = data;
      await createNewCustomer(customerData);
    }
  };

  const handleSaveCustomerPhone = async (id: string, phone: string) => {
    await modifyCustomer(id, { phone });
    setDetailCustomer((prev) => (prev?.id === id ? { ...prev, phone } : prev));
  };

  return (
    <Box layoutClassName="relative flex h-full flex-col gap-6">
      <Box layoutClassName="flex items-center justify-end">
        <Button
          type="button"
          onClick={handleCreate}
          leftIcon={<Plus className="h-4 w-4" />}
          backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-700"
          hoverClassName="hover:from-primary-700 hover:to-primary-800"
          textClassName="text-sm font-semibold text-white"
          roundedClassName="rounded-xl"
          shadowClassName="shadow-md shadow-primary-200/60 dark:shadow-none"
          layoutClassName="inline-flex items-center justify-center gap-2 px-5 py-3"
          stateClassName="transition-all"
        >
          {t('customers.add')}
        </Button>
      </Box>

      {loading ? (
        <Box
          layoutClassName="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600"
          backgroundClassName="bg-slate-50/40 dark:bg-slate-900/20"
        >
          <Box
            layoutClassName="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner"
            backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
          >
            <Users className="h-7 w-7 text-primary-600 dark:text-primary-400" aria-hidden />
          </Box>
          <Spinner size="md" textClassName="text-primary-500" />
          <Typography size="sm" variant="muted">
            {t('customers.loadingHint')}
          </Typography>
        </Box>
      ) : customers.length === 0 ? (
        <Box
          layoutClassName="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-primary-200/80 px-6 py-16 dark:border-primary-900/40"
          backgroundClassName="bg-gradient-to-b from-primary-50/30 to-transparent dark:from-primary-950/10 dark:to-transparent"
        >
          <Box
            layoutClassName="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
            backgroundClassName="bg-gradient-to-br from-primary-500 to-primary-600"
          >
            <Users className="h-10 w-10 text-white opacity-95" aria-hidden />
          </Box>
          <Box layoutClassName="max-w-sm text-center">
            <Typography size="lg" layoutClassName="font-semibold text-slate-900 dark:text-white">
              {t('customers.noData')}
            </Typography>
            <Typography size="sm" variant="muted" layoutClassName="mt-2 leading-relaxed">
              {t('customers.pageSubtitle')}
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={handleCreate}
            leftIcon={<Plus className="h-4 w-4" />}
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-xl"
            shadowClassName="shadow-md"
            layoutClassName="inline-flex items-center gap-2 px-5 py-2.5"
            stateClassName="transition-colors"
          >
            {t('customers.createFirst')}
          </Button>
        </Box>
      ) : (
        <CustomerList
          customers={customers}
          customerStats={customerStats}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onOpenDetail={(c) => setDetailCustomer(c)}
          onSavePhone={handleSaveCustomerPhone}
        />
      )}

      {detailCustomer ? (
        <CustomerDetailPanel
          customer={detailCustomer}
          orders={ordersForDetailCustomer}
          onClose={() => setDetailCustomer(undefined)}
          onSavePhone={handleSaveCustomerPhone}
        />
      ) : null}

      <CustomerForm
        isOpen={isFormOpen}
        initialData={editingCustomer}
        onSave={handleSave}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('customers.delete.title')}
        message={t('customers.delete.confirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default CustomersPage;
