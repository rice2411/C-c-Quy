import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Box, Edit, PlusCircle, Save, Scale, Search, ShoppingBag, X } from 'lucide-react';
import { Ingredient, IngredientHistory, IngredientHistoryType, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuppliers } from '@/contexts/SupplierContext';

interface IngredientFormProps {
  isOpen: boolean;
  initialData?: Ingredient;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

type IngredientTab = 'details' | 'history';

const IngredientForm: React.FC<IngredientFormProps> = ({ isOpen, initialData, onSave, onClose }) => {
  const { t } = useLanguage();
  const { suppliers, loading } = useSuppliers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<IngredientTab>('details');
  const [isClosing, setIsClosing] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<IngredientType>(IngredientType.BASE);
  const [unit, setUnit] = useState<'g' | 'piece'>('g');
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [history, setHistory] = useState<IngredientHistory[]>([]);
  const [historyType, setHistoryType] = useState<IngredientHistoryType>(IngredientHistoryType.IMPORT);
  const [historyImportQuantity, setHistoryImportQuantity] = useState(0);
  const [historyPrice, setHistoryPrice] = useState(0);
  const [historyNote, setHistoryNote] = useState('');
  const [historySupplierId, setHistorySupplierId] = useState('');
  const [historySupplierInput, setHistorySupplierInput] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const supplierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type || IngredientType.BASE);
      setUnit(initialData.unit || 'g');
      setInitialQuantity(initialData.initialQuantity || 0);
      setHistory(initialData.history || []);
      setHistoryType(IngredientHistoryType.IMPORT);
      setHistoryImportQuantity(0);
      setHistoryPrice(0);
      setHistoryNote('');
      setHistorySupplierId('');
      setHistorySupplierInput('');
      setHistoryDate(new Date().toISOString().slice(0, 10));
      setEditingHistoryId(null);
      setActiveTab('details');
    } else {
      setName('');
      setType(IngredientType.BASE);
      setUnit('g');
      setInitialQuantity(0);
      setHistory([]);
      setHistoryType(IngredientHistoryType.IMPORT);
      setHistoryImportQuantity(0);
      setHistoryPrice(0);
      setHistoryNote('');
      setHistorySupplierId('');
      setHistorySupplierInput('');
      setHistoryDate(new Date().toISOString().slice(0, 10));
      setEditingHistoryId(null);
      setActiveTab('details');
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [history]
  );

  const filteredSuppliers = useMemo(
    () =>
      suppliers
        .filter((s) => {
          if (!historySupplierInput.trim()) return true;
          return s.name.toLowerCase().includes(historySupplierInput.toLowerCase());
        })
        .slice(0, 6),
    [suppliers, historySupplierInput]
  );

  const computedQuantity = useMemo(() => {
    const initialQty = initialQuantity;
    return initialQty + history.reduce((acc, item) => {
      return acc + item.importQuantity;
    }, 0);
  }, [history, initialQuantity]);

  const calculateFromQuantity = useMemo(() => {
    const chronological = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let current = initialQuantity;
    const map = new Map<string, number>();
    chronological.forEach((item) => {
      map.set(item.id, current);
      current = current + item.importQuantity;
    });
    return map;
  }, [history, initialQuantity]);

  const historyTotals = useMemo(() => {
    const chronological = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let current = initialQuantity;
    const map = new Map<string, { before: number; after: number }>();
    chronological.forEach((item) => {
      const before = current;
      const after = current + item.importQuantity;
      map.set(item.id, { before, after });
      current = after;
    });
    return map;
  }, [history, initialQuantity]);

  const handleSelectSupplier = (id: string, name: string) => {
    setHistorySupplierId(id);
    setHistorySupplierInput(name);
    setShowSupplierDropdown(false);
  };

  // Handle edit history item - load data into form
  const handleEditHistory = (item: IngredientHistory) => {
    setEditingHistoryId(item.id);
    setHistoryType(item.type);
    setHistoryImportQuantity(item.importQuantity);
    setHistoryPrice(item.price || 0);
    setHistoryNote(item.note || '');
    setHistorySupplierId(item.supplierId || '');
    setHistorySupplierInput(item.supplierName || '');
    setHistoryDate(new Date(item.createdAt).toISOString().slice(0, 10));
    setError(null);
    // Scroll to form
    const formElement = document.querySelector('[data-history-form]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingHistoryId(null);
    setHistoryImportQuantity(0);
    setHistoryPrice(0);
    setHistoryNote('');
    setHistorySupplierId('');
    setHistorySupplierInput('');
    setHistoryDate(new Date().toISOString().slice(0, 10));
    setError(null);
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      setIsSubmitting(true);
      const newHistory = history.filter((h) => h.id !== id);
      setHistory(newHistory);
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        type,
        initialQuantity: initialData?.initialQuantity || 0,
        unit,
        history: newHistory,
      });
    } catch (err: any) {
      setError(err.message || t('ingredients.form.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t('ingredients.form.errors.nameRequired'));
      if (!type) throw new Error(t('ingredients.form.errors.typeRequired'));

      const payload = {
        id: initialData?.id,
        name: name.trim(),
        type,
        initialQuantity,
        unit,
        history,
      };

      await onSave(payload);
      handleClose();
    } catch (err: any) {
      setError(err.message || t('ingredients.form.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHistory = async () => {
    if (historyImportQuantity <= 0) {
      setError(t('ingredients.form.errors.quantityRequired'));
      return;
    }
    if (historyType === IngredientHistoryType.IMPORT && !historySupplierId) {
      setError(t('ingredients.form.errors.supplierRequired'));
      return;
    }
    try {
      setIsSubmitting(true);
      const supplier = suppliers.find((s) => s.id === historySupplierId);
      
      let fromQty: number;
      if (editingHistoryId) {
        fromQty = calculateFromQuantity.get(editingHistoryId) || initialQuantity;
      } else {
        fromQty = computedQuantity;
      }
      
      let newHistory: IngredientHistory[];
      
      if (editingHistoryId) {
        const chronological = [...history].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        let current = initialQuantity;
        newHistory = chronological.map((item) => {
          if (item.id === editingHistoryId) {
            const updatedItem = {
              ...item,
              type: historyType,
              fromQuantity: current,
              importQuantity: historyImportQuantity,
              price: historyPrice,
              note: historyNote.trim(),
              supplierId: historyType === IngredientHistoryType.IMPORT ? historySupplierId : undefined,
              supplierName: historyType === IngredientHistoryType.IMPORT ? supplier?.name || '' : undefined,
              createdAt: new Date(historyDate || Date.now()).toISOString(),
            };
            current = current + historyImportQuantity;
            return updatedItem;
          }
          const updatedItem = {
            ...item,
            fromQuantity: current,
          };
          current = current + item.importQuantity;
          return updatedItem;
        });
      } else {
        const newEntry: IngredientHistory = {
          id: crypto.randomUUID(),
          type: historyType,
          fromQuantity: fromQty,
          importQuantity: historyImportQuantity,
          unit,
          price: historyPrice,
          note: historyNote.trim(),
          supplierId: historyType === IngredientHistoryType.IMPORT ? historySupplierId : undefined,
          supplierName: historyType === IngredientHistoryType.IMPORT ? supplier?.name || '' : undefined,
          createdAt: new Date(historyDate || Date.now()).toISOString(),
        };
        newHistory = [newEntry, ...history];
      }

      setHistory(newHistory);
      setEditingHistoryId(null);
      setHistoryImportQuantity(0);
      setHistoryPrice(0);
      setHistoryNote('');
      setHistorySupplierId('');
      setHistorySupplierInput('');
      setHistoryDate(new Date().toISOString().slice(0, 10));

      await onSave({
        ...initialData,
        initialQuantity,
        history: newHistory,
      });
    } catch (err: any) {
      setError(err.message || t('ingredients.form.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div 
        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={handleClose}
      ></div>
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex pointer-events-none">
        <div className={`w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-colors duration-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          
          <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between bg-white dark:bg-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? t('ingredients.form.editTitle') : t('ingredients.form.addTitle')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('ingredients.form.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-700 px-6 flex space-x-6 bg-white dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' 
                ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t('ingredients.tabDetails')}
            </button>
            {initialData?.id && (
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history' 
                ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t('ingredients.tabHistory')}
            </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {activeTab === 'details' || !initialData?.id ? (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t('ingredients.form.name')} *
                  </label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder={t('ingredients.form.namePlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t('ingredients.form.type')} *
                    </label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as IngredientType)}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        {Object.values(IngredientType).map((value) => {
                          const key = value.toString().toLowerCase();
                          return (
                            <option key={value} value={value}>
                              {t(`ingredients.form.types.${key}`)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t('ingredients.form.unit')} *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'g' | 'piece')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem',
                      }}
                    >
                      <option value="g">g</option>
                      <option value="piece">{t('ingredients.form.unitPiece')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t('ingredients.form.initialQuantity')} *
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder={t('ingredients.form.initialQuantityPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4" data-history-form>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                      {editingHistoryId ? t('ingredients.form.historyEditTitle') : t('ingredients.form.historyTitle')}
                    </h3>
                    {editingHistoryId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {t('form.cancel')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.historyType')}
                      </label>
                      <select
                        value={historyType}
                        onChange={(e) => setHistoryType(e.target.value as IngredientHistoryType)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        <option value={IngredientHistoryType.IMPORT}>{t('ingredients.form.historyTypeImport')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.fromQuantity')}
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          readOnly
                          value={editingHistoryId ? (calculateFromQuantity.get(editingHistoryId) ?? initialQuantity) : computedQuantity}
                          className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed"
                          placeholder={t('ingredients.form.fromQuantityPlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.importQuantity')} *
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={historyImportQuantity}
                          onChange={(e) => setHistoryImportQuantity(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder={t('ingredients.form.importQuantityPlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.historyDate')}
                      </label>
                      <input
                        type="date"
                        value={historyDate}
                        onChange={(e) => setHistoryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.historyPrice')}
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={historyPrice}
                          onChange={(e) => setHistoryPrice(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder={t('ingredients.form.historyPricePlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                        {t('ingredients.form.note')}
                      </label>
                      <input
                        type="text"
                        value={historyNote}
                        onChange={(e) => setHistoryNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder={t('ingredients.form.notePlaceholder')}
                      />
                    </div>
                      <div ref={supplierRef} className="relative">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                          {t('ingredients.form.supplier')}
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <input
                            type="text"
                            value={historySupplierInput}
                            onChange={(e) => {
                              setHistorySupplierInput(e.target.value);
                              setShowSupplierDropdown(true);
                              setHistorySupplierId('');
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                            disabled={loading}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder={t('ingredients.form.supplierPlaceholder')}
                          />
                        </div>
                        {showSupplierDropdown && filteredSuppliers.length > 0 && (
                          <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            <ul className="py-1">
                              {filteredSuppliers.map((sup) => (
                                <li
                                  key={sup.id}
                                  onClick={() => handleSelectSupplier(sup.id, sup.name)}
                                  className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                >
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{sup.name}</p>
                                  {sup.phone && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{sup.phone}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddHistory}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {editingHistoryId ? (
                        <>
                          <Save className="w-4 h-4" />
                          {t('form.save')}
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          {t('ingredients.form.historyAdd')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  {t('ingredients.tabHistory')}
                </h3>
                  {sortedHistory.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {t('ingredients.historyEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedHistory.map((item) => {
                        const isImport = item.type === 'import' || item.type === 'IMPORT' || item.type === IngredientHistoryType.IMPORT;
                        const bg = isImport
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600'
                          : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600';
                        const textColor = isImport
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300';
                        const totals = historyTotals.get(item.id);
                        const isEditing = editingHistoryId === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between border rounded-xl p-4 ${bg} ${isEditing ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''} transition-all`}
                          >
                            <div className="flex-1 space-y-2">
                              {/* Type and Date Header */}
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-bold ${textColor} uppercase tracking-wide`}>
                                  {isImport
                                    ? t('ingredients.form.historyTypeImport')
                                    : t('ingredients.form.historyTypeUsage')}
                                </p>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  {new Date(item.createdAt).toLocaleDateString('vi-VN', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>

                              {/* Quantity Change - Highlighted */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                  {t('ingredients.form.quantity')}:
                                </span>
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold text-slate-700 dark:text-slate-300`}>
                                    {item.fromQuantity} {item.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                  </p>
                                  <span className="text-slate-400 dark:text-slate-500">+</span>
                                  <p className={`text-lg font-bold ${textColor}`}>
                                    {item.importQuantity} {item.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                  </p>
                                  <span className="text-slate-400 dark:text-slate-500">=</span>
                                  <p className={`text-lg font-bold text-green-600 dark:text-green-400`}>
                                    {item.fromQuantity + item.importQuantity} {item.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                  </p>
                                </div>
                              </div>

                              {/* Price - Highlighted */}
                              {typeof item.price === 'number' && item.price > 0 && (
                                <div className="flex items-baseline gap-2 bg-white/60 dark:bg-slate-800/60 px-3 py-2 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {t('ingredients.form.historyPrice')}:
                                  </span>
                                  <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                                    {new Intl.NumberFormat('vi-VN', { 
                                      style: 'currency', 
                                      currency: 'VND' 
                                    }).format(item.price)}
                                  </p>
                                </div>
                              )}

                              {/* Before/After Quantity - Highlighted */}
                              {totals && (
                                <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-3 py-2 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {t('ingredients.form.historyQuantityBefore') || 'Số lượng'}:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      {totals.before} {item.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500">→</span>
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                      {totals.after} {item.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Supplier */}
                              {item.supplierName && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  <span className="font-medium">{t('ingredients.form.supplier')}:</span> {item.supplierName}
                                </p>
                              )}

                              {/* Note */}
                              {item.note && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                  "{item.note}"
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleEditHistory(item)}
                                disabled={isSubmitting}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title={t('form.edit')}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHistory(item.id)}
                                disabled={isSubmitting}
                                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title={t('ingredients.form.historyDelete')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
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
                  <Save className="w-4 h-4" /> {t('ingredients.form.save')}
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

