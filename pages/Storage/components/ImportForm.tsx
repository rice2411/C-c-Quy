import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, Calendar, DollarSign, Scale } from 'lucide-react';
import { IngredientWithStats } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportFormProps {
  ingredient: IngredientWithStats;
  onSave: (data: {
    ingredientId: string;
    amount: number;
    quantity: number;
    unit: string;
    price: number;
    importDate: string;
    note?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const ImportForm: React.FC<ImportFormProps> = ({ ingredient, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default import values from latest import record if exists, otherwise from ingredient stats
  const lastImport = (ingredient.history?.import || []).reduce((latest, imp) => {
    if (!latest) return imp;
    const latestDate = new Date(latest.importDate);
    const currentDate = new Date(imp.importDate);
    return currentDate > latestDate ? imp : latest;
  }, undefined as (typeof ingredient.history.import)[number] | undefined);

  const defaultUnit = lastImport?.unit || ingredient.unit || 'kg';

  const [amount, setAmount] = useState(lastImport?.amount || 0);
  const [quantity, setQuantity] = useState(lastImport?.quantity || 0);
  const [unit, setUnit] = useState(defaultUnit);
  const [price, setPrice] = useState(lastImport?.price ?? ingredient.averagePrice ?? 0);
  const [importDate, setImportDate] = useState(new Date().toISOString().slice(0, 16)); // Format for datetime-local
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (amount <= 0) throw new Error(t('storage.errors.importAmountPositive'));
      if (price < 0) throw new Error(t('storage.errors.importPriceNonNegative'));
      if (!importDate) throw new Error(t('storage.errors.importDateRequired'));

      // Convert datetime-local to ISO string
      const importDateISO = new Date(importDate).toISOString();

      await onSave({
        ingredientId: ingredient.id,
        amount,
        quantity,
        unit,
        price,
        importDate: importDateISO,
        note: note.trim() || undefined
      });
    } catch (err: any) {
      setError(err.message || t('storage.errors.importSaveError'));
      setIsSubmitting(false);
    }
  };

  const units = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'can', 'bottle'];

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
      <div className="absolute inset-y-0 right-0 max-w-lg w-full flex pointer-events-none">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in-right">
          
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('storage.importTitle')}
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
              {/* Amount & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('storage.weight')} *
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('storage.exampleWeight')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('storage.unit')} *
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select 
                      value={unit} 
                      onChange={e => setUnit(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                    >
                      {units.map(u => (
                        <option key={u} value={u}>{t(`units.${u}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.unitQuantity')}
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('storage.exampleUnitQuantity')}
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.importPriceWithUnit')} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="1000"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Import Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.importDateTime')} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="datetime-local" 
                    required
                    value={importDate}
                    onChange={e => setImportDate(e.target.value)}
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
                  <Save className="w-4 h-4" /> {t('storage.saveImportVoucher')}
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

export default ImportForm;

