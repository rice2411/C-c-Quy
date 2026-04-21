import React, { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { useCustomers } from '@/contexts/CustomerContext';
import { useOrders } from '@/contexts/OrderContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer } from '@/types';
import CustomerList from '@/pages/Customers/components/CustomerList';
import CustomerForm from '@/pages/Customers/components/CustomerForm';
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

  const customerStats = useMemo(() => {
    const stats = new Map<string, number>();
    orders.forEach((order) => {
      const phone = order.customer.phone?.replace(/\D/g, '');
      if (!phone) return;

      const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      const current = stats.get(phone) || 0;
      stats.set(phone, current + itemCount);
    });
    return stats;
  }, [orders]);

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

  return (
    <Box layoutClassName="h-full relative flex flex-col space-y-6">
      <Box layoutClassName="flex justify-end">
        <Button
          type="button"
          onClick={handleCreate}
          leftIcon={<Plus />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-orange-600"
          hoverClassName="hover:bg-orange-700"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
          layoutClassName="whitespace-nowrap"
          stateClassName="transition-colors"
        >
          {t('customers.add')}
        </Button>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center">
          <Spinner size="md" textClassName="text-orange-500" />
        </Box>
      ) : customers.length === 0 ? (
        <Box
          layoutClassName="flex flex-1 flex-col items-center justify-center"
          textClassName="text-slate-400 dark:text-slate-500"
        >
          <Users className="mb-4 h-16 w-16 opacity-20" />
          <Typography layoutClassName="mb-4">{t('customers.noData')}</Typography>
          <Button
            type="button"
            onClick={handleCreate}
            variant="secondary"
            textClassName="text-sm text-slate-600 dark:text-slate-300"
            backgroundClassName="bg-slate-100 dark:bg-slate-800"
            hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-700"
            roundedClassName="rounded-lg"
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
        />
      )}

      {isFormOpen && (
        <CustomerForm
          isOpen={isFormOpen}
          initialData={editingCustomer}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
        />
      )}

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
