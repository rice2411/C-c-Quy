import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChefHat, Save, X, Plus, Trash2, Search, AlignLeft, Package, ArrowRight, Box, FlaskConical, Sparkles } from 'lucide-react';
import { Recipe, RecipeIngredient, Ingredient, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCurrentQuantity, isLowStock, isOutOfStock } from '@/utils/ingredientUtil';

const getTypeIcon = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return Box;
    case IngredientType.FLAVOR:
      return FlaskConical;
    case IngredientType.TOPPING:
      return Sparkles;
    case IngredientType.DECORATION:
      return Sparkles;
    case IngredientType.MATERIAL:
      return Package;
    default:
      return Box;
  }
};

const getTypeColors = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        header: 'bg-blue-100 dark:bg-blue-900/40',
      };
    case IngredientType.FLAVOR:
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-600 dark:text-purple-400',
        header: 'bg-purple-100 dark:bg-purple-900/40',
      };
    case IngredientType.TOPPING:
      return {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-700 dark:text-pink-300',
        icon: 'text-pink-600 dark:text-pink-400',
        header: 'bg-pink-100 dark:bg-pink-900/40',
      };
    case IngredientType.DECORATION:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'text-yellow-600 dark:text-yellow-400',
        header: 'bg-yellow-100 dark:bg-yellow-900/40',
      };
    case IngredientType.MATERIAL:
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        header: 'bg-green-100 dark:bg-green-900/40',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-600 dark:text-slate-400',
        header: 'bg-slate-100 dark:bg-slate-700',
      };
  }
};

interface RecipeFormProps {
  isOpen: boolean;
  initialData?: Recipe;
  ingredients: Ingredient[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ isOpen, initialData, ingredients, onSave, onClose }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [outputQuantity, setOutputQuantity] = useState(0);
  const [wasteRate, setWasteRate] = useState(0);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [animatingIngredient, setAnimatingIngredient] = useState<string | null>(null);
  const [flyingIngredient, setFlyingIngredient] = useState<{id: string; name: string; from: {x: number; y: number}; to: {x: number; y: number}} | null>(null);
  const ingredientRef = useRef<HTMLDivElement>(null);
  const ingredientRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const selectedRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const typeOrder: IngredientType[] = [
    IngredientType.BASE,
    IngredientType.FLAVOR,
    IngredientType.TOPPING,
    IngredientType.DECORATION,
    IngredientType.MATERIAL,
  ];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setInstructions(initialData.instructions || '');
      setOutputQuantity(initialData.outputQuantity || 0);
      setWasteRate(initialData.wasteRate || 0);
      setRecipeIngredients(initialData.ingredients || []);
    } else {
      setName('');
      setDescription('');
      setInstructions('');
      setOutputQuantity(0);
      setWasteRate(0);
      setRecipeIngredients([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ingredientRef.current && !ingredientRef.current.contains(event.target as Node)) {
        setShowIngredientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableIngredients = useMemo(
    () =>
      ingredients.filter((ing) => {
        if (!ingredientSearch.trim()) return true;
        return ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
      }).filter((ing) => !recipeIngredients.find((ri) => ri.ingredientId === ing.id)),
    [ingredients, ingredientSearch, recipeIngredients]
  );

  const groupedAvailableIngredients = useMemo(() => {
    const groups: Record<IngredientType, Ingredient[]> = {
      [IngredientType.BASE]: [],
      [IngredientType.FLAVOR]: [],
      [IngredientType.TOPPING]: [],
      [IngredientType.DECORATION]: [],
      [IngredientType.MATERIAL]: [],
    };

    availableIngredients.forEach((ing) => {
      if (groups[ing.type]) {
        groups[ing.type].push(ing);
      }
    });

    return groups;
  }, [availableIngredients]);

  const availableTypes = useMemo(() => {
    const types = new Set<IngredientType>();
    ingredients.forEach((ing) => {
      types.add(ing.type);
    });
    return Array.from(types).sort((a, b) => {
      const orderA = typeOrder.indexOf(a);
      const orderB = typeOrder.indexOf(b);
      return orderA - orderB;
    });
  }, [ingredients]);

  const groupedSelectedIngredients = useMemo(() => {
    const groups: Record<IngredientType, RecipeIngredient[]> = {
      [IngredientType.BASE]: [],
      [IngredientType.FLAVOR]: [],
      [IngredientType.TOPPING]: [],
      [IngredientType.DECORATION]: [],
      [IngredientType.MATERIAL]: [],
    };

    recipeIngredients.forEach((ri) => {
      const ingredient = ingredients.find((ing) => ing.id === ri.ingredientId);
      if (ingredient && groups[ingredient.type]) {
        groups[ingredient.type].push(ri);
      }
    });

    return groups;
  }, [recipeIngredients, ingredients]);


  const handleSelectIngredient = (ingredient: Ingredient, event: React.MouseEvent) => {
    const sourceElement = event.currentTarget as HTMLElement;
    const sourceRect = sourceElement.getBoundingClientRect();
    
    setTimeout(() => {
      const typeIndex = availableTypes.indexOf(ingredient.type);
      const kanbanContainer = document.querySelector('[data-kanban-container]') as HTMLElement;
      if (kanbanContainer) {
        const containerRect = kanbanContainer.getBoundingClientRect();
        const columnWidth = containerRect.width / availableTypes.length;
        const targetX = containerRect.left + (typeIndex * columnWidth) + (columnWidth / 2);
        const selectedSection = document.querySelector(`[data-type="${ingredient.type}"][data-selected-section]`) as HTMLElement;
        const targetY = selectedSection ? selectedSection.getBoundingClientRect().top + 50 : containerRect.top + containerRect.height / 2;
        
        setFlyingIngredient({
          id: ingredient.id,
          name: ingredient.name,
          from: {
            x: sourceRect.left + sourceRect.width / 2,
            y: sourceRect.top + sourceRect.height / 2,
          },
          to: {
            x: targetX,
            y: targetY,
          },
        });

        setTimeout(() => {
          const newIngredient: RecipeIngredient = {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: 0,
            unit: ingredient.unit,
          };
          setRecipeIngredients([...recipeIngredients, newIngredient]);
          setIngredientSearch('');
          setShowIngredientDropdown(false);
          setFlyingIngredient(null);
        }, 600);
      } else {
        const newIngredient: RecipeIngredient = {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: 0,
          unit: ingredient.unit,
        };
        setRecipeIngredients([...recipeIngredients, newIngredient]);
        setIngredientSearch('');
        setShowIngredientDropdown(false);
      }
    }, 10);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setRecipeIngredients(recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId));
  };

  const handleUpdateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setRecipeIngredients(
      recipeIngredients.map((ri) => (ri.ingredientId === ingredientId ? { ...ri, quantity } : ri))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t('recipes.form.errors.nameRequired'));
      if (recipeIngredients.length === 0) throw new Error(t('recipes.form.errors.ingredientsRequired'));
      if (recipeIngredients.some((ri) => ri.quantity <= 0)) {
        throw new Error(t('recipes.form.errors.quantityRequired'));
      }

      const payload = {
        id: initialData?.id,
        name: name.trim(),
        description: description.trim(),
        ingredients: recipeIngredients,
        instructions: instructions.trim(),
        outputQuantity: outputQuantity || 0,
        wasteRate: wasteRate || 0,
      };

      await onSave(payload);
      handleClose();
    } catch (err: any) {
      setError(err.message || t('recipes.form.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      ></div>
      <div className="absolute inset-y-0 right-0 w-full sm:w-3/4 flex pointer-events-none">
        <div
          className={`w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-colors duration-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
        >
          {flyingIngredient && (
            <>
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: `${flyingIngredient.from.x}px`,
                  top: `${flyingIngredient.from.y}px`,
                  transform: 'translate(-50%, -50%)',
                  animation: `flyToTarget-${flyingIngredient.id.replace(/[^a-zA-Z0-9]/g, '')} 0.6s ease-out forwards`,
                }}
              >
                <div className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
                  {flyingIngredient.name}
                </div>
              </div>
              <style>{`
                @keyframes flyToTarget-${flyingIngredient.id.replace(/[^a-zA-Z0-9]/g, '')} {
                  0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: translate(calc(-50% + ${(flyingIngredient.to.x - flyingIngredient.from.x) * 0.5}px), calc(-50% + ${(flyingIngredient.to.y - flyingIngredient.from.y) * 0.5}px)) scale(1.2);
                    opacity: 0.9;
                  }
                  100% {
                    left: ${flyingIngredient.to.x}px;
                    top: ${flyingIngredient.to.y}px;
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                  }
                }
              `}</style>
            </>
          )}
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between bg-white dark:bg-slate-800">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? t('recipes.form.editTitle') : t('recipes.form.addTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('recipes.form.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-6 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t('recipes.form.name')} *
                  </label>
                  <div className="relative">
                    <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                      placeholder={t('recipes.form.namePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t('recipes.form.description')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none touch-manipulation"
                    placeholder={t('recipes.form.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t('recipes.form.outputQuantity')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={outputQuantity === 0 ? '' : outputQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setOutputQuantity(value === '' ? 0 : Number(value));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t('recipes.form.wasteRate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={wasteRate === 0 ? '' : wasteRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          setWasteRate(Math.min(100, Math.max(0, numValue)));
                        }}
                        className="w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    {t('recipes.form.ingredients')} *
                  </h3>
                </div>

                <div ref={ingredientRef} className="relative mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={ingredientSearch}
                      onChange={(e) => {
                        setIngredientSearch(e.target.value);
                        setShowIngredientDropdown(true);
                      }}
                      onFocus={() => setShowIngredientDropdown(true)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder={t('recipes.form.addIngredientPlaceholder')}
                    />
                  </div>
                  {showIngredientDropdown && availableIngredients.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      <ul className="py-1">
                        {availableIngredients.slice(0, 10).map((ing) => (
                          <li
                            key={ing.id}
                            onClick={(e) => {
                              const fakeEvent = { currentTarget: e.currentTarget } as React.MouseEvent;
                              handleSelectIngredient(ing, fakeEvent);
                            }}
                            className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{ing.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t(`ingredients.form.types.${ing.type.toString().toLowerCase()}`)} • {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div 
                  data-kanban-container
                  className="flex flex-col sm:grid gap-3 sm:gap-3 overflow-y-auto sm:overflow-x-visible pb-2 sm:pb-0"
                  style={{ 
                    gridTemplateColumns: availableTypes.length > 0 ? `repeat(${availableTypes.length}, minmax(0, 1fr))` : undefined,
                  }}
                >
                  {availableTypes.map((type) => {
                    const TypeIcon = getTypeIcon(type);
                    const colors = getTypeColors(type);
                    const available = groupedAvailableIngredients[type] || [];
                    const selected = groupedSelectedIngredients[type] || [];
                    const typeKey = type.toString().toLowerCase();

                    return (
                      <div
                        key={type}
                        className={`flex flex-col rounded-lg border-2 ${colors.border} ${colors.bg} overflow-hidden w-full sm:w-auto`}
                      >
                        <div className={`${colors.header} px-2 sm:px-3 py-1.5 sm:py-2 border-b ${colors.border}`}>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <TypeIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.icon}`} />
                            <h4 className="text-[10px] sm:text-xs font-bold ${colors.text} uppercase tracking-wide truncate">
                              {t(`ingredients.form.types.${typeKey}`)}
                            </h4>
                          </div>
                          <p className="text-[9px] sm:text-[10px] ${colors.text} mt-0.5 opacity-70">
                            {selected.length} {t('recipes.form.selected')}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden">
                          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 min-h-[80px] sm:min-h-[120px] max-h-[150px] sm:max-h-none">
                            {available.length === 0 ? (
                              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 text-center py-2">
                                {t('recipes.form.allAdded')}
                              </p>
                            ) : (
                              available.map((ing) => {
                                const currentQuantity = calculateCurrentQuantity(ing);
                                const lowStock = isLowStock(ing);
                                const outOfStock = isOutOfStock(ing);
                                return (
                                  <div
                                    key={ing.id}
                                    ref={(el) => {
                                      if (el) ingredientRefs.current.set(ing.id, el);
                                    }}
                                    onClick={(e) => handleSelectIngredient(ing, e)}
                                    className={`p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded border ${colors.border} hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all group active:scale-95 ${
                                      flyingIngredient?.id === ing.id ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                                    } ${outOfStock ? 'opacity-50' : ''}`}
                                    style={{
                                      transition: flyingIngredient?.id === ing.id ? 'all 0.3s ease-out' : 'all 0.2s',
                                    }}
                                  >
                                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 mb-1">
                                      {ing.name}
                                    </p>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[8px] sm:text-[9px] font-semibold ${
                                        outOfStock ? 'text-red-500 dark:text-red-400' : 
                                        lowStock ? 'text-orange-500 dark:text-orange-400' : 
                                        'text-slate-500 dark:text-slate-400'
                                      }`}>
                                        {outOfStock ? t('recipes.form.outOfStock') : 
                                         `${currentQuantity.toLocaleString()} ${ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div 
                            data-type={type}
                            data-selected-section
                            className={`border-t ${colors.border} p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 max-h-[120px] sm:max-h-[200px] overflow-y-auto bg-white/50 dark:bg-slate-800/50`}
                          >
                            {selected.length === 0 ? (
                              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 text-center py-2">
                                {t('recipes.form.none')}
                              </p>
                            ) : (
                              selected.map((ri) => {
                                const ingredient = ingredients.find((ing) => ing.id === ri.ingredientId);
                                const isNew = flyingIngredient?.id === ri.ingredientId;
                                return (
                                  <div
                                    key={ri.ingredientId}
                                    ref={(el) => {
                                      if (el) selectedRefs.current.set(ri.ingredientId, el);
                                    }}
                                    className={`p-1 sm:p-1.5 bg-white dark:bg-slate-800 rounded border-2 ${colors.border} ${
                                      isNew ? 'animate-in zoom-in-50 slide-in-from-bottom-4 duration-500' : ''
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1 mb-1">
                                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-900 dark:text-white truncate flex-1">
                                        {ri.ingredientName}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveIngredient(ri.ingredientId);
                                        }}
                                        className="p-0.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded transition-colors flex-shrink-0 touch-manipulation"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={ri.quantity}
                                      onChange={(e) => handleUpdateIngredientQuantity(ri.ingredientId, Number(e.target.value))}
                                      className="w-full px-1.5 py-1 sm:py-0.5 text-[10px] sm:text-[10px] bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none touch-manipulation"
                                      placeholder="0"
                                    />
                                    <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {ri.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                                    </p>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t('recipes.form.instructions')}
                  </label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={4}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                      placeholder={t('recipes.form.instructionsPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 active:bg-orange-800 dark:active:bg-orange-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors touch-manipulation"
                >
                  {isSubmitting ? t('form.saving') : (
                    <>
                      <Save className="w-4 h-4" /> {t('recipes.form.save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecipeForm;
