import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, Scale, Search, Check } from 'lucide-react';
import { Ingredient } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkIngredientExists, fetchIngredients } from '@/services/ingredientService';

interface IngredientFormProps {
  initialData?: Ingredient | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const IngredientForm: React.FC<IngredientFormProps> = ({ initialData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [note, setNote] = useState('');

  // Dropdown states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const nameRef = useRef<HTMLDivElement>(null);
  const supplierRef = useRef<HTMLDivElement>(null);

  // Load all ingredients for dropdown
  useEffect(() => {
    if (!initialData) {
      // Only load when creating new ingredient
      const loadIngredients = async () => {
        setLoadingIngredients(true);
        try {
          const data = await fetchIngredients();
          // Convert IngredientWithStats to Ingredient for dropdown
          const ingredients: Ingredient[] = data.map(item => ({
            id: item.id,
            name: item.name,
            supplier: item.supplier,
            amount: item.amount || 0,
            quantity: item.quantity || 0,
            unit: item.unit,
            note: item.note,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
          setAllIngredients(ingredients);
        } catch (error) {
          console.error('Error loading ingredients:', error);
        } finally {
          setLoadingIngredients(false);
        }
      };
      loadIngredients();
    }
  }, [initialData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameRef.current && !nameRef.current.contains(event.target as Node)) {
        setShowNameDropdown(false);
      }
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSupplier(initialData.supplier);
      setAmount(initialData.amount || 0);
      setQuantity(initialData.quantity || 0);
      setUnit(initialData.unit);
      setNote(initialData.note || '');
    } else {
      // Reset form for new ingredient
      setName('');
      setSupplier('');
      setAmount(0);
      setQuantity(0);
      setUnit('kg');
      setNote('');
    }
  }, [initialData]);

  // Filter ingredients for name dropdown
  const nameResults = allIngredients.filter(ing => {
    if (!name.trim()) return false;
    const term = name.toLowerCase();
    return ing.name.toLowerCase().includes(term);
  }).slice(0, 5);

  // Filter ingredients for supplier dropdown
  const supplierResults = allIngredients.filter(ing => {
    if (!supplier.trim()) return false;
    const term = supplier.toLowerCase();
    return ing.supplier.toLowerCase().includes(term);
  }).slice(0, 5);

  // Handle selecting by name only (partial match)
  const handleSelectByName = (ingredient: Ingredient) => {
    setName(ingredient.name);
    setSupplier(ingredient.supplier);
    setAmount(ingredient.amount || 0);
    setQuantity(ingredient.quantity || 0);
    setUnit(ingredient.unit);
    setNote(ingredient.note || '');
    setShowNameDropdown(false);
  };

  // Handle selecting by supplier only (partial match)
  const handleSelectBySupplier = (ingredient: Ingredient) => {
    setName(ingredient.name);
    setSupplier(ingredient.supplier);
    setAmount(ingredient.amount || 0);
    setQuantity(ingredient.quantity || 0);
    setUnit(ingredient.unit);
    setNote(ingredient.note || '');
    setShowSupplierDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t('storage.errors.nameRequired'));
      if (!supplier.trim()) throw new Error(t('storage.errors.supplierRequired'));

      // Check for duplicate when creating new ingredient
      if (!initialData) {
        const exists = await checkIngredientExists(name.trim(), supplier.trim());
        if (exists) {
          throw new Error(t('storage.errors.duplicateIngredient'));
        }
      }

      const formData = {
        id: initialData?.id,
        name: name.trim(),
        supplier: supplier.trim(),
        amount,
        quantity,
        unit,
        note: note.trim(),
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || t('storage.errors.saveIngredient'));
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? t('storage.formTitleEdit') : t('storage.formTitleAdd')}
            </h2>
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
              {/* Name - Required with Dropdown */}
              <div className="relative" ref={nameRef}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.name')} *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => !initialData && setShowNameDropdown(true)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder={t('storage.namePlaceholder')}
                    autoComplete="off"
                    disabled={!!initialData}
                  />
                </div>

                {/* Name Dropdown Results */}
                {!initialData && showNameDropdown && nameResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-1">
                      {nameResults.map((ingredient) => (
                        <li 
                          key={ingredient.id}
                          onClick={() => handleSelectByName(ingredient)}
                          className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">
                                {ingredient.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ingredient.supplier} {ingredient.unit && `• ${t(`units.${ingredient.unit}`)}`}
                              </p>
                            </div>
                            {ingredient.name.toLowerCase() === name.toLowerCase() && (
                              <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Supplier - Required with Dropdown */}
              <div className="relative" ref={supplierRef}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('storage.supplier')} *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={supplier}
                    onChange={e => {
                      setSupplier(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => !initialData && setShowSupplierDropdown(true)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder={t('storage.supplierPlaceholder')}
                    autoComplete="off"
                    disabled={!!initialData}
                  />
                </div>

                {/* Supplier Dropdown Results */}
                {!initialData && showSupplierDropdown && supplierResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-1">
                      {supplierResults.map((ingredient) => (
                        <li 
                          key={ingredient.id}
                          onClick={() => handleSelectBySupplier(ingredient)}
                          className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400">
                                {ingredient.supplier}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ingredient.name} {ingredient.unit && `• ${t(`units.${ingredient.unit}`)}`}
                              </p>
                            </div>
                            {ingredient.supplier.toLowerCase() === supplier.toLowerCase() && (
                              <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Amount & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('storage.weight')}
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      min="0"
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
                    {t('storage.unit')}
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

              {/* Notes */}
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
                  <Save className="w-4 h-4" /> {t('form.saveIngredient')}
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

export default IngredientForm;
