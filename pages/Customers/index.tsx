import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, UserCheck, Users } from 'lucide-react';
import { useCustomers } from '@/contexts/CustomerContext';
import { useOrders } from '@/contexts/OrderContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer } from '@/types';
import CustomerList from '@/pages/Customers/components/CustomerList';
import CustomerForm from '@/pages/Customers/components/CustomerForm';
import CustomerDetailPanel from '@/pages/Customers/components/CustomerDetailPanel';
import { parseDateValue } from '@/utils/dateUtil';
import { getNormalizedPhoneDigits } from '@/utils/vietnameseMobilePhone';
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

  const pillTotal = t('customers.statsPillTotal').replace('{{n}}', String(customers.length));
  const pillActive = t('customers.statsPillActive').replace('{{n}}', String(withOrderHistory));

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
      <Box
        layoutClassName="relative overflow-hidden rounded-2xl border border-orange-200/70 p-6 sm:p-8 dark:border-orange-900/35"
        backgroundClassName="bg-gradient-to-br from-orange-50/95 via-white to-amber-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/25"
      >
        <Box
          layoutClassName="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full blur-3xl"
          backgroundClassName="bg-orange-300/25 dark:bg-orange-500/15"
          aria-hidden
        />
        <Box
          layoutClassName="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full blur-2xl"
          backgroundClassName="bg-amber-200/30 dark:bg-amber-600/10"
          aria-hidden
        />

        <Box layoutClassName="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <Box layoutClassName="max-w-2xl space-y-3">
            <Box layoutClassName="inline-flex items-center gap-2 rounded-full border border-orange-200/80 px-3 py-1 dark:border-orange-800/60">
              <Sparkles className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" aria-hidden />
              <Typography size="xs" layoutClassName="font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                {t('customers.title')}
              </Typography>
            </Box>
            <Typography as="h1" layoutClassName="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t('header.customersTitle')}
            </Typography>
            <Typography size="sm" variant="muted" layoutClassName="max-w-xl leading-relaxed">
              {t('customers.pageSubtitle')}
            </Typography>
            <Box layoutClassName="flex flex-wrap gap-2 pt-1">
              <Box
                layoutClassName="inline-flex items-center gap-2 rounded-xl border border-white/80 px-3 py-2 shadow-sm dark:border-slate-700/80"
                backgroundClassName="bg-white/90 dark:bg-slate-800/90"
              >
                <Users className="h-4 w-4 text-orange-500" aria-hidden />
                <Typography size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">
                  {pillTotal}
                </Typography>
              </Box>
              <Box
                layoutClassName="inline-flex items-center gap-2 rounded-xl border border-white/80 px-3 py-2 shadow-sm dark:border-slate-700/80"
                backgroundClassName="bg-white/90 dark:bg-slate-800/90"
              >
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <Typography size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">
                  {pillActive}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Button
            type="button"
            onClick={handleCreate}
            leftIcon={<Plus className="h-4 w-4" />}
            backgroundClassName="bg-gradient-to-r from-orange-600 to-amber-600"
            hoverClassName="hover:from-orange-700 hover:to-amber-700"
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-xl"
            shadowClassName="shadow-md shadow-orange-200/60 dark:shadow-none"
            layoutClassName="inline-flex w-full shrink-0 items-center justify-center gap-2 px-5 py-3 lg:w-auto lg:self-center"
            stateClassName="transition-all"
          >
            {t('customers.add')}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box
          layoutClassName="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600"
          backgroundClassName="bg-slate-50/40 dark:bg-slate-900/20"
        >
          <Box
            layoutClassName="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner"
            backgroundClassName="bg-orange-100 dark:bg-orange-900/40"
          >
            <Users className="h-7 w-7 text-orange-600 dark:text-orange-400" aria-hidden />
          </Box>
          <Spinner size="md" textClassName="text-orange-500" />
          <Typography size="sm" variant="muted">
            {t('customers.loadingHint')}
          </Typography>
        </Box>
      ) : customers.length === 0 ? (
        <Box
          layoutClassName="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-orange-200/80 px-6 py-16 dark:border-orange-900/40"
          backgroundClassName="bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-950/10 dark:to-transparent"
        >
          <Box
            layoutClassName="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
            backgroundClassName="bg-gradient-to-br from-orange-500 to-amber-500"
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
            backgroundClassName="bg-orange-600"
            hoverClassName="hover:bg-orange-700"
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
