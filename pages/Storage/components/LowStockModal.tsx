import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Package } from 'lucide-react';
import { IngredientWithStats } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface LowStockModalProps {
  items: IngredientWithStats[];
  onClose: () => void;
}

const LowStockModal: React.FC<LowStockModalProps> = ({ items, onClose }) => {
  const { t } = useLanguage();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex pointer-events-none">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in-right">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('storage.lowStockModalTitle')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {items.length} {t('storage.lowStockModalSubtitle')}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('storage.noLowStockItems')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  // Calculate percentage remaining based on total imported quantity
                  const totalImported = item.totalImportedQuantity || 0;
                  const percentage = totalImported > 0
                    ? Math.round((item.currentQuantity / totalImported) * 100)
                    : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {item.name}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 ml-6">
                            {item.supplier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            {item.currentQuantity} {t(`units.${item.unit}`)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {percentage}{t('storage.percentageOfImported')}
                          </p>
                        </div>
                      </div>

                      <div className="ml-6 space-y-1">
                        {totalImported > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">{t('storage.totalImported')}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {totalImported} {t(`units.${item.unit}`)}
                            </span>
                          </div>
                        )}
                        {item.averagePrice && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">{t('storage.averagePrice')}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {formatVND(item.averagePrice)}/{t(`units.${item.unit}`)}
                            </span>
                          </div>
                        )}
                        {item.lastImportDate && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">{t('storage.lastImport')}</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {new Date(item.lastImportDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {totalImported > 0 && (
                        <div className="mt-3 ml-6">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                percentage < 20
                                  ? 'bg-red-600 dark:bg-red-500'
                                  : percentage < 50
                                  ? 'bg-orange-500 dark:bg-orange-400'
                                  : 'bg-yellow-500 dark:bg-yellow-400'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm transition-colors"
            >
              {t('storage.close')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LowStockModal;

