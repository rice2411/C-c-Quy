import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Import, ClipboardCheck, Calendar, DollarSign, Scale } from 'lucide-react';
import { IngredientWithStats } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface HistoryModalProps {
  ingredient: IngredientWithStats;
  onClose: () => void;
}

type TabType = 'all' | 'import' | 'inventory';

interface HistoryItem {
  id: string;
  type: 'import' | 'inventory';
  date: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  price?: number;
  note?: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ ingredient, onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Use history directly from ingredient prop (already parsed from fetchIngredients)
  const allRecords = useMemo(() => {
    const imports = ingredient.history?.import || [];
    const inventories = ingredient.history?.inventory || [];

    const combined: HistoryItem[] = [
      ...imports.map(imp => ({
        id: imp.id,
        type: 'import' as const,
        date: imp.importDate,
        amount: imp.amount,
        quantity: imp.quantity,
        unit: imp.unit,
        price: imp.price,
        note: imp.note
      })),
      ...inventories.map(inv => ({
        id: inv.id,
        type: 'inventory' as const,
        date: inv.inventoryDate,
        amount: inv.amount,
        quantity: inv.quantity,
        note: inv.note
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combined;
  }, [ingredient.history]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
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

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const displayRecords = useMemo(() => {
    switch (activeTab) {
      case 'import':
        return allRecords.filter(r => r.type === 'import');
      case 'inventory':
        return allRecords.filter(r => r.type === 'inventory');
      default:
        return allRecords;
    }
  }, [allRecords, activeTab]);

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex pointer-events-none">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in-right">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('storage.historyTitle')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {ingredient.name} - {ingredient.supplier}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'all'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('storage.historyTabAll')}
                {activeTab === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'import'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('storage.historyTabImport')}
                {activeTab === 'import' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'inventory'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('storage.historyTabInventory')}
                {activeTab === 'inventory' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400"></span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {displayRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                {activeTab === 'all' && (
                  <>
                    <Calendar className="w-16 h-16 mb-4 opacity-20" />
                    <p>{t('storage.historyEmptyAll')}</p>
                  </>
                )}
                {activeTab === 'import' && (
                  <>
                    <Import className="w-16 h-16 mb-4 opacity-20" />
                    <p>{t('storage.historyEmptyImport')}</p>
                  </>
                )}
                {activeTab === 'inventory' && (
                  <>
                    <ClipboardCheck className="w-16 h-16 mb-4 opacity-20" />
                    <p>{t('storage.historyEmptyInventory')}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.type === 'import'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {record.type === 'import' ? (
                          <Import className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ClipboardCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        <span className={`font-medium ${
                          record.type === 'import'
                            ? 'text-blue-900 dark:text-blue-300'
                            : 'text-green-900 dark:text-green-300'
                        }`}>
                          {record.type === 'import' ? t('storage.historyTabImport') : t('storage.historyTabInventory')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(record.date)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {record.amount !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('storage.weight')}</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                            <Scale className="w-4 h-4 text-slate-400" />
                            {record.amount} {record.unit ? t(`units.${record.unit}`) : t(`units.${ingredient.unit}`)}
                          </p>
                        </div>
                      )}

                      {record.quantity !== undefined && record.quantity > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('storage.unitQuantity')}</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                            <Scale className="w-4 h-4 text-slate-400" />
                            {record.quantity}
                          </p>
                        </div>
                      )}

                      {record.price !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('storage.importPrice')}</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            {formatVND(record.price)}
                          </p>
                        </div>
                      )}

                      {record.type === 'import' && record.price !== undefined && record.amount !== undefined && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('storage.historyTotalPrice')}</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatVND(record.price)}
                          </p>
                        </div>
                      )}
                    </div>

                    {record.note && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('storage.note')}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{record.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HistoryModal;

