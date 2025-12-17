import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Loader2, AlertTriangle, Archive, Import, ClipboardCheck, History } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IngredientWithStats } from '@/types';
import { 
  fetchIngredients, 
  addIngredient, 
  updateIngredient, 
  deleteIngredient,
  addImportRecord,
  addInventoryRecord
} from '@/services/ingredientService';
import IngredientForm from './components/IngredientForm';
import ImportForm from './components/ImportForm';
import InventoryForm from './components/InventoryForm';
import HistoryModal from './components/HistoryModal';
import LowStockModal from './components/LowStockModal';
import ConfirmModal from '@/components/ConfirmModal';  

const StoragePage: React.FC = () => {
  const { t } = useLanguage();
  const [ingredients, setIngredients] = useState<IngredientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithStats | undefined>(undefined);

  // Import/Inventory State
  const [importIngredient, setImportIngredient] = useState<IngredientWithStats | undefined>(undefined);
  const [inventoryIngredient, setInventoryIngredient] = useState<IngredientWithStats | undefined>(undefined);

  // History State
  const [historyIngredient, setHistoryIngredient] = useState<IngredientWithStats | undefined>(undefined);

  // Low Stock Modal State
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadIngredients = async () => {
    setLoading(true);
    const data = await fetchIngredients();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const handleCreate = () => {
    setEditingIngredient(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (ingredient: IngredientWithStats) => {
    setEditingIngredient(ingredient);
    setIsFormOpen(true);
  };

  const handleSave = async (data: any) => {
    if (data.id) {
      await updateIngredient(data.id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...ingredientData } = data;
      await addIngredient(ingredientData);
    }
    await loadIngredients();
    setIsFormOpen(false);
  };

  const handleImport = (ingredient: IngredientWithStats) => {
    setImportIngredient(ingredient);
  };

  const handleSaveImport = async (data: any) => {
    await addImportRecord(data);
    await loadIngredients();
    setImportIngredient(undefined);
  };

  const handleInventory = (ingredient: IngredientWithStats) => {
    setInventoryIngredient(ingredient);
  };

  const handleSaveInventory = async (data: any) => {
    await addInventoryRecord(data);
    await loadIngredients();
    setInventoryIngredient(undefined);
  };

  const handleViewHistory = (ingredient: IngredientWithStats) => {
    setHistoryIngredient(ingredient);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteIngredient(deleteId);
      await loadIngredients();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (i.supplier && i.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [ingredients, searchTerm]);

  // Separate low stock items
  const lowStockItems = useMemo(() => {
    return filteredIngredients.filter(item => item.isLowStock);
  }, [filteredIngredients]);

  const stats = useMemo(() => {
    const totalItems = ingredients.length;
    const totalValue = ingredients.reduce((sum, item) => {
      // Total value per ingredient = sum(price * amount) from all import records
      const imports = item.history?.import || [];
      const ingredientTotal = imports.reduce((importSum, imp) => {
        return importSum + (Number(imp.price || 0) * Number(imp.quantity || 0));
      }, 0);

      return sum + ingredientTotal;
    }, 0);
    const lowStockCount = ingredients.filter(item => item.isLowStock).length;
    
    return { totalItems, totalValue, lowStockCount };
  }, [ingredients]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="w-full relative flex flex-col space-y-6 min-h-0">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('storage.totalIngredients')}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalItems}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <Package className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('storage.totalValue')}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatVND(stats.totalValue)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Archive className="w-6 h-6" />
            </div>
        </div>
        <button
          onClick={() => setIsLowStockModalOpen(true)}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md ${
            stats.lowStockCount > 0 
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30' 
              : 'border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('storage.lowStock')}</p>
                <h3 className={`text-2xl font-bold mt-1 ${
                  stats.lowStockCount > 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                    {stats.lowStockCount}
                </h3>
            </div>
            <div className={`p-3 rounded-lg ${
              stats.lowStockCount > 0 
                ? 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
           <input 
             type="text" 
             placeholder={t('storage.searchPlaceholder')}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
           />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>{t('storage.addIngredient')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : filteredIngredients.length === 0 ? (
         <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
           <Package className="w-16 h-16 mb-4 opacity-20" />
           <p className="mb-4">{t('storage.noIngredients')}</p>
           {ingredients.length === 0 && (
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {t('storage.createFirst')}
              </button>
           )}
         </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('storage.name')}</th>
                  <th className="px-6 py-3 font-medium">{t('storage.columnQuantity')}</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">{t('storage.columnImportCount')}</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">{t('storage.columnItemValue')}</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">{t('storage.supplier')}</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">{t('storage.columnLastImport')}</th>
                  <th className="px-6 py-3 font-medium text-right">{t('storage.columnActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredIngredients.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      item.isLowStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                             {item.isLowStock && (
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" title={t('storage.lowStockTooltip')} />
                             )}
                             <div>
                               <div className="font-medium">{item.name}</div>
                               {item.isLowStock && (
                                 <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                   {t('storage.lowStockBadge')}
                                 </div>
                               )}
                             </div>
                        </div>
                    </td>
                    <td className={`px-6 py-4 font-medium ${
                      item.isLowStock 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      <div>
                        <div>
                          {t('storage.currentQuantityLabel')}: {item.currentQuantity} <span className="text-xs text-slate-400 ml-1">{t(`units.${item.unit}`)}</span>
                        </div>
                        {item.amount > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('storage.weight')}: {item.amount} {t(`units.${item.unit}`)}
                          </div>
                        )}
                        {item.quantity > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('storage.quantity')}: {item.quantity}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Import count */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {item.history?.import?.length ?? 0}
                    </td>

                    {/* Total value = sum(price * amount) from import history */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {(() => {
                        const imports = item.history?.import || [];
                        if (imports.length === 0) return '-';
                        const total = imports.reduce((importSum, imp) => {
                          return importSum + (Number(imp.price || 0) * Number(imp.quantity || 0));
                        }, 0);
                        return formatVND(total);
                      })()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {item.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {formatDate(item.lastImportDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleViewHistory(item)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title={t('storage.actionViewHistory')}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleImport(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t('storage.actionImport')}
                        >
                          <Import className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleInventory(item)}
                          className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={t('storage.actionInventory')}
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title={t('storage.actionEdit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('storage.actionDelete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <IngredientForm 
           initialData={editingIngredient}
           onSave={handleSave}
           onCancel={() => setIsFormOpen(false)}
        />
      )}

      {importIngredient && (
        <ImportForm
          ingredient={importIngredient}
          onSave={handleSaveImport}
          onCancel={() => setImportIngredient(undefined)}
        />
      )}

      {inventoryIngredient && (
        <InventoryForm
          ingredient={inventoryIngredient}
          onSave={handleSaveInventory}
          onCancel={() => setInventoryIngredient(undefined)}
        />
      )}

      {historyIngredient && (
        <HistoryModal
          ingredient={historyIngredient}
          onClose={() => setHistoryIngredient(undefined)}
        />
      )}

      {isLowStockModalOpen && (
        <LowStockModal
          items={lowStockItems}
          onClose={() => setIsLowStockModalOpen(false)}
        />
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title={t('storage.title')}
        message={t('storage.deleteConfirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StoragePage;
