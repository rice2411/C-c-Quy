import React, { useState } from 'react';
import { Factory, Plus } from 'lucide-react';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Supplier } from '@/types';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import ConfirmModal from '@/components/ConfirmModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const SuppliersPage: React.FC = () => {
  const { suppliers, loading, createSupplier, modifySupplier, removeSupplier } = useSuppliers();
  const { t } = useLanguage();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingSupplier(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
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
      await removeSupplier(deleteId);
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
      await modifySupplier(data.id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...supplierData } = data;
      await createSupplier(supplierData);
    }
  };

  return (
    <Box layoutClassName="relative flex h-full flex-col space-y-6">
      <Box layoutClassName="flex justify-end">
        <Button
          type="button"
          onClick={handleCreate}
          leftIcon={<Plus />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          layoutClassName="whitespace-nowrap gap-2"
          backgroundClassName="bg-orange-600"
          hoverClassName="hover:bg-orange-700"
          textClassName="text-sm font-medium text-white"
          roundedClassName="rounded-lg"
          shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
          stateClassName="transition-colors"
          disableVariantHover
          disableVariantTextColor
        >
          {t('suppliers.add')}
        </Button>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center">
          <Spinner size="lg" textClassName="text-orange-500" />
        </Box>
      ) : suppliers.length === 0 ? (
        <Box
          layoutClassName="flex flex-1 flex-col items-center justify-center"
          textClassName="text-slate-400 dark:text-slate-500"
        >
          <Factory className="mb-4 h-16 w-16 opacity-20" />
          <Typography layoutClassName="mb-4">{t('suppliers.noData')}</Typography>
          <Button
            type="button"
            onClick={handleCreate}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            sizeClassName="px-4 py-2"
            backgroundClassName="bg-slate-100 dark:bg-slate-800"
            hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-700"
            textClassName="text-sm text-slate-600 dark:text-slate-300"
            roundedClassName="rounded-lg"
            stateClassName="transition-colors"
          >
            {t('suppliers.createFirst')}
          </Button>
        </Box>
      ) : (
        <SupplierList
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      )}

       {isFormOpen && (
         <SupplierForm 
           isOpen={isFormOpen}
           initialData={editingSupplier}
           onSave={handleSave}
           onClose={() => setIsFormOpen(false)}
         />
       )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('suppliers.delete.title')}
        message={t('suppliers.delete.confirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default SuppliersPage;

