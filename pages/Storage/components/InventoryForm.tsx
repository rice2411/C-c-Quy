import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, Calendar } from 'lucide-react';
import { IngredientWithStats } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface InventoryFormProps {
  ingredient: IngredientWithStats;
  onSave: (data: {
    ingredientId: string;
    amount: number;
    quantity: number;
    inventoryDate: string;
    note?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ ingredient, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(ingredient.currentQuantity || 0);
  const [quantity, setQuantity] = useState(0);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().slice(0, 16)); // Format for datetime-local
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (amount < 0) throw new Error(t('storage.errors.inventoryAmountNonNegative'));
      if (quantity < 0) throw new Error(t('storage.errors.inventoryQuantityNonNegative'));
      if (!inventoryDate) throw new Error(t('storage.errors.inventoryDateRequired'));

      // Convert datetime-local to ISO string
      const inventoryDateISO = new Date(inventoryDate).toISOString();

      await onSave({
        ingredientId: ingredient.id,
        amount,
        quantity,
        inventoryDate: inventoryDateISO,
        note: note.trim() || undefined
      });
    } catch (err: any) {
      setError(err.message || t('storage.errors.inventorySaveError'));
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
      <div className="absolute inset-y-0 right-0 max-w-lg w-full flex pointer-events-none">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in-right">
          
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('storage.inventoryTitle')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {ingredient.name} - {ingredient.supplier}
              </p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Current Quantity Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  {t('storage.currentQuantityCalculated')}
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {ingredient.currentQuantity} <span className="text-sm font-normal">{t(`units.${ingredient.unit}`)}</span>
                </p>
                {ingredient.isLowStock && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t('storage.lowStockBadge')}
                  </p>
                )}
              </div>

              {/* Inventory Amount & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('storage.remainingWeight')} *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('storage.exampleWeight')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('storage.unitQuantity')}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('storage.exampleUnitQuantity')}
                  </p>
                </div>
              </div>

              {/* Inventory Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.inventoryDateTime')} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="datetime-local" 
                    required
                    value={inventoryDate}
                    onChange={e => setInventoryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.note')}
                </label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  placeholder={t('storage.notePlaceholder')}
                />
              </div>
            </div>

          </form>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
             <button 
              type="button" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {t('form.cancel')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center gap-2 disabled:opacity-70 transition-colors"
            >
               {isSubmitting ? t('form.saving') : (
                <>
                  <Save className="w-4 h-4" /> {t('storage.saveInventoryVoucher')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InventoryForm;
