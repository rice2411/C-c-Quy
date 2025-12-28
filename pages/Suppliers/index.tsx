import React, { useState } from 'react';
import { Plus, Factory, Loader2 } from 'lucide-react';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Supplier } from '@/types';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import ConfirmModal from '@/components/ConfirmModal';

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
    <div className="h-full relative flex flex-col space-y-6">
       <div className="flex justify-end">
          <button 
             onClick={handleCreate}
             className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-200 dark:shadow-none whitespace-nowrap"
           >
             <Plus className="w-4 h-4" />
             <span>{t('suppliers.add')}</span>
           </button>
       </div>

       {loading ? (
          <div className="flex-1 flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
       ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
             <Factory className="w-16 h-16 mb-4 opacity-20" />
             <p className="mb-4">{t('suppliers.noData')}</p>
             <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {t('suppliers.createFirst')}
              </button>
          </div>
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
    </div>
  );
};

export default SuppliersPage;

