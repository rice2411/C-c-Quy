import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Box, Calendar, DollarSign, Edit, Package, PlusCircle, Save, Scale, Search, ShoppingBag, X } from 'lucide-react';
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

  const formatUnit = (unitValue: 'g' | 'piece'): string => {
    return unitValue === 'piece' ? t('ingredients.form.unitPiece') : 'g';
  };

  const [name, setName] = useState('');
  const [type, setType] = useState<IngredientType>(IngredientType.BASE);
  const [unit, setUnit] = useState<'g' | 'piece'>('g');
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [history, setHistory] = useState<IngredientHistory[]>([]);
  const [historyType, setHistoryType] = useState<IngredientHistoryType>(IngredientHistoryType.IMPORT);
  const [productWeight, setProductWeight] = useState(0);
  const [historyImportQuantity, setHistoryImportQuantity] = useState(0);
  const [historyPrice, setHistoryPrice] = useState(0);
  const [historyNote, setHistoryNote] = useState('');
  const [historySupplierId, setHistorySupplierId] = useState('');
  const [historySupplierInput, setHistorySupplierInput] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
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
      setHistorySearch('');
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
      setHistorySearch('');
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

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return sortedHistory;
    const searchLower = historySearch.toLowerCase();
    return sortedHistory.filter((item) => {
      const supplierMatch = item.supplierName?.toLowerCase().includes(searchLower);
      const noteMatch = item.note?.toLowerCase().includes(searchLower);
      const dateMatch = new Date(item.createdAt).toLocaleDateString('vi-VN').includes(searchLower);
      const quantityMatch = item.importQuantity.toString().includes(searchLower);
      const priceMatch = item.price?.toString().includes(searchLower);
      const productWeightMatch = item.productWeight?.toString().includes(searchLower);
      const totalAmount = item.price && item.importQuantity ? item.price * item.importQuantity : 0;
      const totalAmountMatch = totalAmount > 0 ? totalAmount.toString().includes(searchLower.replace(/[^\d]/g, '')) : false;
      const totalWeight = item.productWeight && item.importQuantity ? item.productWeight * item.importQuantity : 0;
      const totalWeightMatch = totalWeight > 0 ? totalWeight.toString().includes(searchLower.replace(/[^\d]/g, '')) : false;
      return supplierMatch || noteMatch || dateMatch || quantityMatch || priceMatch || productWeightMatch || totalAmountMatch || totalWeightMatch;
    });
  }, [sortedHistory, historySearch]);

  const totalAmount = useMemo(() => {
    return historyImportQuantity * historyPrice;
  }, [historyImportQuantity, historyPrice]);

  const totalWeight = useMemo(() => {
    if (productWeight > 0 && historyImportQuantity > 0) {
      if (unit === 'piece') {
        return productWeight * historyImportQuantity;
      } else {
        return productWeight * historyImportQuantity;
      }
    }
    return 0;
  }, [productWeight, historyImportQuantity, unit]);

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
    setHistoryType(IngredientHistoryType.IMPORT);
    setHistoryImportQuantity(item.importQuantity);
    setProductWeight(item.productWeight || 0);
    setHistoryDate(new Date(item.createdAt).toISOString().slice(0, 10));
    setHistoryPrice(item.price || 0);
    setHistoryNote(item.note || '');
    setHistorySupplierId(item.supplierId || '');
    setHistorySupplierInput(item.supplierName || '');
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
    if (productWeight <= 0) {
      setError(t('ingredients.form.errors.productWeightRequired'));
      return;
    }
    if (historyImportQuantity <= 0) {
      setError(t('ingredients.form.errors.quantityRequired'));
      return;
    }
    if (!historySupplierId) {
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
            const updatedItem: any = {
              ...item,
              type: IngredientHistoryType.IMPORT,
              fromQuantity: current,
              importQuantity: historyImportQuantity,
              productWeight: productWeight > 0 ? productWeight : undefined,
              createdAt: new Date(historyDate || Date.now()).toISOString(),
            };
            updatedItem.price = historyPrice || 0;
            updatedItem.note = historyNote.trim() || '';
            updatedItem.supplierId = historySupplierId || '';
            updatedItem.supplierName = supplier?.name || '';
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
        const newEntry: any = {
          id: crypto.randomUUID(),
          type: IngredientHistoryType.IMPORT,
          fromQuantity: fromQty,
          importQuantity: historyImportQuantity,
          productWeight: productWeight > 0 ? productWeight : undefined,
          unit,
          createdAt: new Date(historyDate || Date.now()).toISOString(),
        };
        newEntry.price = historyPrice || 0;
        newEntry.note = historyNote.trim() || '';
        newEntry.supplierId = historySupplierId || '';
        newEntry.supplierName = supplier?.name || '';
        newHistory = [newEntry, ...history];
      }

      setHistory(newHistory);
      setEditingHistoryId(null);
      setProductWeight(0);
      setHistoryImportQuantity(0);
      setHistoryPrice(0);
      setHistoryNote('');
      setHistorySupplierId('');
      setHistorySupplierInput('');
      setHistoryDate(new Date().toISOString().slice(0, 10));
      setError(null);

      await onSave({
        ...initialData,
        initialQuantity,
        history: newHistory,
        _isHistoryUpdate: true,
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
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-2xl flex pointer-events-none">
        <div className={`w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-colors duration-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between bg-white dark:bg-slate-800">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? t('ingredients.form.editTitle') : t('ingredients.form.addTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('ingredients.form.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 sm:p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors flex-shrink-0 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6 flex space-x-4 sm:space-x-6 bg-white dark:bg-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
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
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === 'history' 
                ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t('ingredients.tabHistory')}
            </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-6 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {activeTab === 'details' || !initialData?.id ? (
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
                    {t('ingredients.form.name')} *
                  </label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 sm:pl-9 pr-3 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-base sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                      placeholder={t('ingredients.form.namePlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
                      {t('ingredients.form.type')} *
                    </label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10 pointer-events-none" />
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as IngredientType)}
                        className="w-full pl-10 sm:pl-9 pr-10 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-base sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer touch-manipulation"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.75rem',
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
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
                      {t('ingredients.form.unit')} *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'g' | 'piece')}
                      className="w-full px-3 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-base sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer touch-manipulation"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.75rem',
                      }}
                    >
                      <option value="g">g</option>
                      <option value="piece">{t('ingredients.form.unitPiece')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
                    {t('ingredients.form.initialQuantity')} *
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full pl-10 sm:pl-9 pr-3 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-base sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                      placeholder={t('ingredients.form.initialQuantityPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg" data-history-form>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {editingHistoryId ? t('ingredients.form.historyEditTitle') : t('ingredients.form.historyTitle')}
                      </h3>
                    </div>
                    {editingHistoryId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                      >
                        {t('form.cancel')}
                      </button>
                    )}
                  </div>
                  
                  {/* 4 Main Input Fields */}
                  <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2">
                    {/* Khối lượng sản phẩm - hiển thị cho cả 2 đơn vị */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Scale className="w-4 h-4 text-orange-500" />
                        {t('ingredients.form.productWeight')} (g/{formatUnit(unit)}) *
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={productWeight}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setProductWeight(value);
                          }}
                          className="w-full pl-12 pr-16 py-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg text-base font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all touch-manipulation"
                          placeholder={unit === 'piece' ? t('ingredients.form.productWeightPlaceholderPiece') : t('ingredients.form.productWeightPlaceholderGram')}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-orange-600 dark:text-orange-400">
                          g/{formatUnit(unit)}
                        </span>
                      </div>
                      {productWeight > 0 && historyImportQuantity > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                          {t('ingredients.form.totalWeightLabel')} {totalWeight.toLocaleString('vi-VN')}g
                        </p>
                      )}
                    </div>

                    {/* Số lượng nhập */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span>
                          {t('ingredients.form.importQuantity')} 
                        </span>
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step={unit === 'piece' ? '1' : '0.01'}
                          required
                          value={historyImportQuantity}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setHistoryImportQuantity(value);
                          }}
                          className="w-full pl-12 pr-16 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-base font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all touch-manipulation"
                          placeholder={t('ingredients.form.importQuantityPlaceholder')}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {formatUnit(unit)}
                        </span>
                      </div>
                      {productWeight > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {t('ingredients.form.importQuantityHint')
                            .replace('{productWeight}', productWeight.toString())
                            .replace('{unit}', formatUnit(unit))}
                        </p>
                      )}
                    </div>

                    {/* Đơn giá */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        {t('ingredients.form.unitPrice')} (VND/{formatUnit(unit)}) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 z-10 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={historyPrice}
                          onChange={(e) => setHistoryPrice(Number(e.target.value))}
                          className="w-full pl-12 pr-16 py-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg text-base font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all touch-manipulation"
                          placeholder={t('ingredients.form.historyPricePlaceholder')}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-green-600 dark:text-green-400">
                          VND
                        </span>
                      </div>
                    </div>

                    {/* Ngày nhập */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        {t('ingredients.form.importDate')} *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 z-10 pointer-events-none" />
                        <input
                          type="date"
                          required
                          value={historyDate}
                          onChange={(e) => setHistoryDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-base font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all touch-manipulation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Field */}
                  {historyType === IngredientHistoryType.IMPORT && (
                    <div className="mb-6">
                      <div ref={supplierRef} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          <Search className="w-4 h-4 text-indigo-500" />
                          {t('ingredients.form.supplier')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
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
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-base font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all touch-manipulation"
                            placeholder={t('ingredients.form.supplierPlaceholder')}
                          />
                        </div>
                        {showSupplierDropdown && filteredSuppliers.length > 0 && (
                          <div className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                            <ul className="py-1">
                              {filteredSuppliers.map((sup) => (
                                <li
                                  key={sup.id}
                                  onClick={() => handleSelectSupplier(sup.id, sup.name)}
                                  className="px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                >
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{sup.name}</p>
                                  {sup.phone && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sup.phone}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Display */}
                  {(historyImportQuantity > 0 || productWeight > 0) && historyPrice > 0 && (
                    <div className="mb-6 p-5 bg-gradient-to-r from-orange-50 via-green-50 to-blue-50 dark:from-orange-900/20 dark:via-green-900/20 dark:to-blue-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl shadow-sm">
                      <div className="space-y-3">
                        {productWeight > 0 && (
                          <div className="flex items-center justify-between pb-2 border-b border-orange-200 dark:border-orange-800">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              {t('ingredients.form.productWeight')} × {t('ingredients.form.importQuantity')}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {productWeight}g/{formatUnit(unit)} × {historyImportQuantity} {formatUnit(unit)} = {totalWeight.toLocaleString('vi-VN')}g
                              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                ({historyImportQuantity} × {productWeight}g)
                              </span>
                            </p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                              {t('ingredients.form.importQuantity')} × {t('ingredients.form.unitPrice')}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {historyImportQuantity.toLocaleString('vi-VN')} {formatUnit(unit)} × {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND',
                                maximumFractionDigits: 0
                              }).format(historyPrice)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase block mb-1">
                              {t('ingredients.form.totalAmount')}
                            </span>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND',
                                maximumFractionDigits: 0
                              }).format(totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Note Field */}
                  {historyType === IngredientHistoryType.IMPORT && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        {t('ingredients.form.note')}
                      </label>
                      <input
                        type="text"
                        value={historyNote}
                        onChange={(e) => setHistoryNote(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all touch-manipulation"
                        placeholder={t('ingredients.form.notePlaceholder')}
                      />
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleAddHistory}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] touch-manipulation"
                    >
                      {editingHistoryId ? (
                        <>
                          <Save className="w-5 h-5" />
                          {t('form.save')}
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-5 h-5" />
                          {t('ingredients.form.historyAdd')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    {t('ingredients.tabHistory')}
                  </h3>
                  {sortedHistory.length > 0 && (
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder={t('ingredients.form.searchHistory') || 'Tìm kiếm lịch sử...'}
                      />
                    </div>
                  )}
                </div>
                  {filteredHistory.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {historySearch ? t('ingredients.noSearchResults') : t('ingredients.historyEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((item) => {
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
                            className={`flex items-start justify-between border rounded-xl p-3 sm:p-4 ${bg} ${isEditing ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''} transition-all`}
                          >
                            <div className="flex-1 min-w-0 space-y-2 pr-2">
                              {/* Type and Date Header */}
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs sm:text-sm font-bold ${textColor} uppercase tracking-wide truncate`}>
                                  {isImport
                                    ? t('ingredients.form.historyTypeImport')
                                    : t('ingredients.form.historyTypeUsage')}
                                </p>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                                  {new Date(item.createdAt).toLocaleDateString('vi-VN', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>

                              {/* Product Weight - if available */}
                              {item.productWeight && item.productWeight > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2 sm:px-3 py-2 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {t('ingredients.form.productWeight')}:
                                  </span>
                                  <p className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400">
                                    {item.productWeight}g/{formatUnit(item.unit)}
                                    {item.importQuantity > 0 && (
                                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                        (× {item.importQuantity} = {(item.productWeight * item.importQuantity).toLocaleString('vi-VN')}g)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Import Quantity - Simple display */}
                              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 sm:px-3 py-2 rounded-lg">
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                  {t('ingredients.form.importQuantity')}:
                                </span>
                                <p className={`text-sm sm:text-base font-bold ${textColor}`}>
                                  {item.importQuantity}
                                </p>
                              </div>

                              {/* Price and Total Amount - Highlighted */}
                              <div className="flex flex-col sm:flex-row gap-2">
                                {typeof item.price === 'number' && item.price > 0 && (
                                  <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 bg-white/60 dark:bg-slate-800/60 px-2 sm:px-3 py-2 rounded-lg">
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                      {t('ingredients.form.historyPrice')}:
                                    </span>
                                    <p className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400">
                                      {new Intl.NumberFormat('vi-VN', { 
                                        style: 'currency', 
                                        currency: 'VND' 
                                      }).format(item.price)}/{formatUnit(item.unit)}
                                    </p>
                                  </div>
                                )}
                                {typeof item.price === 'number' && item.price > 0 && item.importQuantity > 0 && (
                                  <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 sm:px-3 py-2 rounded-lg">
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">
                                      {t('ingredients.form.totalAmount')}:
                                    </span>
                                    <p className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                                      {new Intl.NumberFormat('vi-VN', { 
                                        style: 'currency', 
                                        currency: 'VND' 
                                      }).format(item.price * item.importQuantity)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Weight Before/After - Highlighted */}
                              {item.productWeight && item.productWeight > 0 && totals && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2 sm:px-3 py-2 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {t('ingredients.form.totalWeight')} {t('ingredients.form.historyQuantityBefore') || '(Trước / sau)'}:
                                  </span>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">
                                      {(totals.before * item.productWeight).toLocaleString('vi-VN')}g
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500">→</span>
                                    <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">
                                      {(totals.after * item.productWeight).toLocaleString('vi-VN')}g
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Quantity Before/After - Only if no productWeight */}
                              {(!item.productWeight || item.productWeight <= 0) && totals && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 bg-white/60 dark:bg-slate-800/60 px-2 sm:px-3 py-2 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {t('ingredients.form.historyQuantityBefore') || 'Số lượng (Trước / sau)'}:
                                  </span>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      {totals.before} {formatUnit(item.unit)}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500">→</span>
                                    <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                      {totals.after} {formatUnit(item.unit)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Supplier */}
                              {item.supplierName && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  <span className="font-medium">{t('ingredients.form.supplier')}:</span> {item.supplierName}
                                </p>
                              )}

                              {/* Note */}
                              {item.note && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 italic break-words">
                                  "{item.note}"
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-2 ml-2 sm:ml-4">
                              <button
                                type="button"
                                onClick={() => handleEditHistory(item)}
                                disabled={isSubmitting}
                                className="p-2.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                                title={t('form.edit')}
                              >
                                <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHistory(item.id)}
                                disabled={isSubmitting}
                                className="p-2.5 sm:p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                                title={t('ingredients.form.historyDelete')}
                              >
                                <X className="w-5 h-5 sm:w-4 sm:h-4" />
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

          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-base sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 touch-manipulation"
            >
              {t('form.cancel')}
            </button>
            {activeTab === 'details' && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-base sm:text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors touch-manipulation"
              >
                {isSubmitting ? t('form.saving') : (
                  <>
                    <Save className="w-5 h-5 sm:w-4 sm:h-4" /> {t('ingredients.form.save')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IngredientForm;

